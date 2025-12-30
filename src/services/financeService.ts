import adminApiClient from './apiClient';

export interface FinanceKPIs {
  gmv: number;
  netRevenue: number;
  grossProfit: number;
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
   * Calculate finance KPIs from orders data
   */
  async getFinanceKPIs(): Promise<FinanceKPIs> {
    try {
      console.log('💰 [FinanceService] Calculating KPIs...');

      // Fetch all orders
      const orders = (await adminApiClient.get('/orders/admin/all')) as any;
      const allOrders = orders || [];

      // Calculate KPIs
      const gmv = allOrders.reduce((sum: number, order: any) => sum + (order.total || 0), 0);
      
      // Net revenue = sum of paid orders
      const paidOrders = allOrders.filter((o: any) => o.paymentStatus === 'paid');
      const netRevenue = paidOrders.reduce((sum: number, order: any) => sum + (order.total || 0), 0);
      
      // Gross profit estimate (22% margin)
      const grossProfit = 0.22;
      
      // Average order value
      const avgOrderValue = paidOrders.length > 0 ? parseFloat((netRevenue / paidOrders.length).toFixed(2)) : 0;
      
      // MRR (Monthly recurring revenue) - estimated from subscriptions
      const subscriptions = (await adminApiClient.get('/subscriptions')) as any;
      const activeSubscriptions = (subscriptions || []).filter((s: any) => s.status === 'active').length;
      const mrr = activeSubscriptions * 25; // Assuming GHS 25/month per subscription
      
      // Failed payment rate
      const failedOrders = allOrders.filter((o: any) => o.paymentStatus === 'failed');
      const failedPaymentRate = allOrders.length > 0 ? failedOrders.length / allOrders.length : 0;

      const kpis: FinanceKPIs = {
        gmv: parseFloat(gmv.toFixed(2)),
        netRevenue: parseFloat(netRevenue.toFixed(2)),
        grossProfit,
        avgOrderValue,
        mrr: parseFloat(mrr.toFixed(2)),
        activeSubscriptions,
        failedPaymentRate,
      };

      console.log('✅ [FinanceService] KPIs calculated:', kpis);
      return kpis;
    } catch (error: any) {
      console.error('❌ [FinanceService] Failed to calculate KPIs:', error.message);
      throw error;
    }
  }

  /**
   * Get revenue trends for the past N days
   */
  async getRevenueTrends(days: number = 7): Promise<RevenueTrend[]> {
    try {
      console.log(`📈 [FinanceService] Fetching revenue trends for ${days} days...`);

      const orders = (await adminApiClient.get('/orders/admin/all')) as any;
      const allOrders = orders || [];

      // Group by date
      const dateMap = new Map<string, { gmv: number; net: number }>();

      allOrders.forEach((order: any) => {
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

      console.log('✅ [FinanceService] Revenue trends:', trends);
      return trends;
    } catch (error: any) {
      console.error('❌ [FinanceService] Failed to fetch revenue trends:', error.message);
      return [];
    }
  }

  /**
   * Get revenue breakdown by zone
   */
  async getRevenueByZone(): Promise<RevenueByZone[]> {
    try {
      console.log('🗺️ [FinanceService] Fetching revenue by zone...');

      const orders = (await adminApiClient.get('/orders/admin/all')) as any;
      const allOrders = orders || [];

      // Group by zone
      const zoneMap = new Map<string, number>();

      allOrders.forEach((order: any) => {
        const zoneName = order.Zone?.name || 'Unassigned';
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

      console.log('✅ [FinanceService] Revenue by zone:', zones);
      return zones;
    } catch (error: any) {
      console.error('❌ [FinanceService] Failed to fetch revenue by zone:', error.message);
      return [];
    }
  }

  /**
   * Get top customers by spending
   */
  async getTopCustomers(limit: number = 10): Promise<TopCustomer[]> {
    try {
      console.log('👥 [FinanceService] Fetching top customers...');

      const orders = (await adminApiClient.get('/orders/admin/all')) as any;
      const allOrders = orders || [];

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

      allOrders.forEach((order: any) => {
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

      console.log('✅ [FinanceService] Top customers:', customers);
      return customers;
    } catch (error: any) {
      console.error('❌ [FinanceService] Failed to fetch top customers:', error.message);
      return [];
    }
  }

  /**
   * Get failed payments
   */
  async getFailedPayments(limit: number = 10): Promise<FailedPayment[]> {
    try {
      console.log('❌ [FinanceService] Fetching failed payments...');

      const orders = (await adminApiClient.get('/orders/admin/all')) as any;
      const allOrders = orders || [];

      // Filter failed payments
      const failedPayments = allOrders
        .filter((order: any) => order.paymentStatus === 'failed' || order.status === 'failed')
        .map((order: any) => ({
          date: new Date(order.createdAt).toISOString().split('T')[0],
          customer: order.User?.name || 'Unknown',
          amount: order.total || 0,
          method: order.paymentMethod || 'Card',
          status: 'failed',
        }))
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit);

      console.log('✅ [FinanceService] Failed payments:', failedPayments);
      return failedPayments;
    } catch (error: any) {
      console.error('❌ [FinanceService] Failed to fetch failed payments:', error.message);
      return [];
    }
  }

  /**
   * Get active subscriptions count
   */
  async getActiveSubscriptions(): Promise<number> {
    try {
      console.log('📋 [FinanceService] Fetching active subscriptions...');

      const subscriptions = (await adminApiClient.get('/subscriptions')) as any;
      const activeCount = (subscriptions || []).filter((s: any) => s.status === 'active').length;

      console.log('✅ [FinanceService] Active subscriptions:', activeCount);
      return activeCount;
    } catch (error: any) {
      console.error('❌ [FinanceService] Failed to fetch subscriptions:', error.message);
      return 0;
    }
  }
}

export default new FinanceService();
