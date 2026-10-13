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
  grossProfitIsEstimate: boolean;
  avgOrderValue: number;
  mrr: number;
  activeSubscriptions: number;
  failedPaymentRate: number;
}

export interface PnLBucket {
  period: string;
  revenue: number;
  cogs: number;
  contribution: number;
  opex: number;
  operatingResult: number;
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
   * Get finance KPIs from the backend's real-cost calculation
   * (CostCalculationService), not re-derived client-side.
   */
  async getFinanceKPIs(): Promise<FinanceKPIs> {
    try {
      return await adminApiClient.get<FinanceKPIs>('/admin/finance/kpis');
    } catch (error) {
      logger.error('❌ [FinanceService] Failed to fetch KPIs:', (error as Error).message);
      return {
        gmv: 0,
        netRevenue: 0,
        grossProfit: 0,
        grossProfitMargin: 22.0,
        grossProfitIsEstimate: true,
        avgOrderValue: 0,
        mrr: 0,
        activeSubscriptions: 0,
        failedPaymentRate: 0,
      };
    }
  }

  /**
   * Get revenue trends for the past N days from the backend.
   */
  async getRevenueTrends(days: number = 7): Promise<RevenueTrend[]> {
    try {
      const trends = await adminApiClient.get<{ date: string; gmv: number; net: number; orders: number }[]>(
        `/admin/finance/revenue-trends?days=${days}`,
      );
      return trends.map(({ date, gmv, net }) => ({ date, gmv, net }));
    } catch (error) {
      logger.error('❌ [FinanceService] Failed to fetch revenue trends:', (error as Error).message);
      return [];
    }
  }

  /**
   * Get revenue breakdown by zone from the backend's persisted Order.zoneId.
   */
  async getRevenueByZone(): Promise<RevenueByZone[]> {
    try {
      const zones = await adminApiClient.get<{ zoneId: number | null; zoneName: string; revenue: number; orders: number }[]>(
        '/admin/finance/revenue-by-zone',
      );
      return zones.map(({ zoneName, revenue }) => ({ zone: zoneName, revenue }));
    } catch (error) {
      logger.error('❌ [FinanceService] Failed to fetch revenue by zone:', (error as Error).message);
      return [];
    }
  }

  /**
   * Get period P&L (contribution vs opex) from the backend.
   */
  async getPeriodPnL(period: 'daily' | 'weekly' | 'monthly', start?: string, end?: string): Promise<PnLBucket[]> {
    try {
      const params = new URLSearchParams({ period });
      if (start) params.set('start', start);
      if (end) params.set('end', end);
      return await adminApiClient.get<PnLBucket[]>(`/admin/finance/pnl?${params.toString()}`);
    } catch (error) {
      logger.error('❌ [FinanceService] Failed to fetch P&L:', (error as Error).message);
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
