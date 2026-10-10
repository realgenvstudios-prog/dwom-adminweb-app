import adminApiClient from './apiClient';
import { logger } from '../utils/logger';
import type { AdminOrderSummary } from './ordersService';
import type { Subscription } from './subscriptionsService';

function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object' && Array.isArray((value as { data?: unknown }).data)) {
    return (value as { data: T[] }).data;
  }
  return [];
}

async function fetchAllOrders(): Promise<AdminOrderSummary[]> {
  const response = await adminApiClient.get<{ data: AdminOrderSummary[] } | AdminOrderSummary[]>('/orders/admin/all');
  return asArray<AdminOrderSummary>(response);
}

async function fetchAllSubscriptions(): Promise<Subscription[]> {
  const response = await adminApiClient.get<{ data: Subscription[] } | Subscription[]>('/subscriptions');
  return asArray<Subscription>(response);
}

export interface FinanceKPIs {
  gmv: number;
  netRevenue: number;
  grossProfit: number;
  grossProfitMargin: number;
  avgOrderValue: number;
  mrr: number;
  activeSubscriptions: number;
  failedPaymentRate: number;
}

export interface RevenueTrend {
  date: string;
  gmv: number;
  net: number;
}

export interface RevenueByZone {
  zone: string;
  revenue: number;
}

export interface TopCustomer {
  name: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  avgOrder: number;
  lastOrder: string;
}

export interface FailedPayment {
  date: string;
  customer: string;
  amount: number;
  method: string;
  status: string;
}

class FinanceService {
  /**
   * Get finance KPIs - Calculate from orders data with error handling
   */
  async getFinanceKPIs(): Promise<FinanceKPIs> {
    try {

      // Fetch all orders
      let allOrders: AdminOrderSummary[] = [];
      try {
        allOrders = await fetchAllOrders();
      } catch (orderError) {
        logger.warn('⚠️ Could not fetch /orders/admin/all, returning zero values', orderError);
        // Return zero values if orders can't be fetched
        return {
          gmv: 0,
          netRevenue: 0,
          grossProfit: 0,
          grossProfitMargin: 22.0,
          avgOrderValue: 0,
          mrr: 0,
          activeSubscriptions: 0,
          failedPaymentRate: 0,
        };
      }

      // Calculate GMV (all orders)
      const gmv = allOrders.reduce((sum: number, order) => sum + (order.total || 0), 0);
      
      // Net revenue (paid orders only)
      const paidOrders = allOrders.filter((o) => o.paymentStatus === 'paid');
      const netRevenue = paidOrders.reduce((sum: number, order) => sum + (order.total || 0), 0);
      
      // Gross profit margin (22% default, will be configurable via backend later)
      const grossProfitMargin = 22.0;
      const grossProfit = netRevenue * (grossProfitMargin / 100);
      
      // Average order value (from paid orders)
      const avgOrderValue = paidOrders.length > 0 ? netRevenue / paidOrders.length : 0;
      
      // MRR from subscriptions
      let activeSubscriptions = 0;
      try {
        const subscriptions = await fetchAllSubscriptions();
        activeSubscriptions = subscriptions.filter((s) => s.status === 'active').length;
      } catch (subError) {
        logger.warn('⚠️ Could not fetch subscriptions', subError);
      }
      
      const subscriptionPrice = 25.0; // Default GHS/month
      const mrr = activeSubscriptions * subscriptionPrice;
      
      // Failed payment rate
      const failedOrders = allOrders.filter((o) => o.paymentStatus === 'failed');
      const failedPaymentRate = allOrders.length > 0 ? failedOrders.length / allOrders.length : 0;

      const kpis: FinanceKPIs = {
        gmv: parseFloat(gmv.toFixed(2)),
        netRevenue: parseFloat(netRevenue.toFixed(2)),
        grossProfit: parseFloat(grossProfit.toFixed(2)),
        grossProfitMargin: grossProfitMargin,
        avgOrderValue: parseFloat(avgOrderValue.toFixed(2)),
        mrr: parseFloat(mrr.toFixed(2)),
        activeSubscriptions,
        failedPaymentRate,
      };

      return kpis;
    } catch (error) {
      logger.error('❌ [FinanceService] Failed to calculate KPIs:', (error as Error).message);
      // Return zero values on error instead of throwing
      return {
        gmv: 0,
        netRevenue: 0,
        grossProfit: 0,
        grossProfitMargin: 22.0,
        avgOrderValue: 0,
        mrr: 0,
        activeSubscriptions: 0,
        failedPaymentRate: 0,
      };
    }
  }

  /**
   * Get revenue trends for the past N days with error handling
   */
  async getRevenueTrends(days: number = 7): Promise<RevenueTrend[]> {
    try {

      let allOrders: AdminOrderSummary[] = [];
      try {
        allOrders = await fetchAllOrders();
      } catch (orderError) {
        logger.warn('⚠️ Could not fetch /orders/admin/all for trends', orderError);
        return [];
      }

      if (!allOrders || allOrders.length === 0) {
        return [];
      }

      // Group by date
      const dateMap = new Map<string, { gmv: number; net: number }>();

      allOrders.forEach((order) => {
        const orderDate = new Date(order.createdAt);
        const dateKey = orderDate.toISOString().split('T')[0]; // YYYY-MM-DD format

        if (!dateMap.has(dateKey)) {
          dateMap.set(dateKey, { gmv: 0, net: 0 });
        }

        const existing = dateMap.get(dateKey)!;
        existing.gmv += order.total || 0;

        if (order.paymentStatus === 'paid') {
          existing.net += order.total || 0;
        }
      });

      // Convert to array and sort
      const trends = Array.from(dateMap.entries())
        .map(([date, data]) => ({
          date,
          gmv: parseFloat(data.gmv.toFixed(2)),
          net: parseFloat(data.net.toFixed(2)),
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-days);

      return trends;
    } catch (error) {
      logger.error('❌ [FinanceService] Failed to fetch revenue trends:', (error as Error).message);
      return [];
    }
  }

  /**
   * Get revenue breakdown by zone
   */
  async getRevenueByZone(): Promise<RevenueByZone[]> {
    try {

      const allOrders = await fetchAllOrders();

      // Group by zone — the admin orders endpoint doesn't select a Zone
      // relation, so every order currently falls into "Unassigned". Fixing
      // that is a backend change (adding Zone to findAllForAdmin's select),
      // out of scope here.
      const zoneMap = new Map<string, number>();

      allOrders.forEach((order) => {
        const zoneName = 'Unassigned';
        const currentRevenue = zoneMap.get(zoneName) || 0;
        zoneMap.set(zoneName, currentRevenue + (order.total || 0));
      });

      // Convert to array and sort by revenue descending
      const zones = Array.from(zoneMap.entries())
        .map(([zone, revenue]) => ({
          zone,
          revenue: parseFloat(revenue.toFixed(2)),
        }))
        .sort((a, b) => b.revenue - a.revenue);

      return zones;
    } catch (error) {
      logger.error('❌ [FinanceService] Failed to fetch revenue by zone:', (error as Error).message);
      return [];
    }
  }

  /**
   * Get top customers by spending
   */
  async getTopCustomers(limit: number = 10): Promise<TopCustomer[]> {
    try {

      const allOrders = await fetchAllOrders();

      // Group by customer
      const customerMap = new Map<
        number,
        {
          name: string;
          phone: string;
          totalOrders: number;
          totalSpent: number;
          lastOrder: string;
        }
      >();

      allOrders.forEach((order) => {
        const userId = order.userId;
        const userName = order.User?.name || 'Unknown';
        const userPhone = order.User?.phoneNumber || 'N/A';

        if (!customerMap.has(userId)) {
          customerMap.set(userId, {
            name: userName,
            phone: userPhone,
            totalOrders: 0,
            totalSpent: 0,
            lastOrder: '',
          });
        }

        const customer = customerMap.get(userId)!;
        customer.totalOrders += 1;
        customer.totalSpent += order.total || 0;
        customer.lastOrder = new Date(order.createdAt).toISOString().split('T')[0];
      });

      // Convert to array, calculate avg order value, and sort by spending
      const customers = Array.from(customerMap.entries())
        .map(([_, customer]) => ({
          ...customer,
          avgOrder: parseFloat((customer.totalSpent / customer.totalOrders).toFixed(2)),
          totalSpent: parseFloat(customer.totalSpent.toFixed(2)),
        }))
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, limit);

      return customers;
    } catch (error) {
      logger.error('❌ [FinanceService] Failed to fetch top customers:', (error as Error).message);
      return [];
    }
  }

  /**
   * Get failed payments
   */
  async getFailedPayments(limit: number = 10): Promise<FailedPayment[]> {
    try {

      const allOrders = await fetchAllOrders();

      // Filter failed payments
      const failedPayments = allOrders
        .filter((order) => order.paymentStatus === 'failed' || order.status === 'failed')
        .map((order) => ({
          date: new Date(order.createdAt).toISOString().split('T')[0],
          customer: order.User?.name || 'Unknown',
          amount: order.total || 0,
          method: order.paymentMethod || 'Card',
          status: 'failed',
        }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit);

      return failedPayments;
    } catch (error) {
      logger.error('❌ [FinanceService] Failed to fetch failed payments:', (error as Error).message);
      return [];
    }
  }

  /**
   * Get active subscriptions count
   */
  async getActiveSubscriptions(): Promise<number> {
    try {

      const subscriptions = await fetchAllSubscriptions();
      const activeCount = subscriptions.filter((s) => s.status === 'active').length;

      return activeCount;
    } catch (error) {
      logger.error('❌ [FinanceService] Failed to fetch subscriptions:', (error as Error).message);
      return 0;
    }
  }
}

export default new FinanceService();
