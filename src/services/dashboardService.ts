import adminApiClient from './apiClient';

function asArray<T>(value: any): T[] {
  if (Array.isArray(value)) return value as T[];
  if (Array.isArray(value?.data)) return value.data as T[];
  return [];
}

export interface DashboardStats {
  totalOrdersToday: number;
  completedOrders: number;
  canceledOrders: number;
  revenueToday: number;
  allOrdersCount: number;
}

export interface RiderStats {
  totalRiders: number;
  activeRiders: number;
  inactiveRiders: number;
  averageRating: number;
}

export interface ProductStats {
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
}

export interface OrderTrend {
  date: string;
  orders: number;
  revenue: number;
}

export interface PopularProduct {
  id: number;
  nameEnglish: string;
  quantity: number;
  revenue: number;
  imageUrl?: string;
}

export interface DashboardData {
  stats: DashboardStats;
  riderStats: RiderStats;
  productStats: ProductStats;
  orderTrends?: OrderTrend[];
  popularProducts?: PopularProduct[];
}

class DashboardService {
  /**
   * Get order statistics overview
   */
  async getOrderStats(): Promise<DashboardStats> {
    try {
      console.log('📊 [DashboardService] Fetching order statistics...');

      // Prefer admin dashboard stats endpoint for consistency
      const response = await adminApiClient.get<DashboardStats>('/admin/dashboard/orders');
      console.log('✅ [DashboardService] Order stats loaded:', response);
      return response;
    } catch (error: any) {
      console.error('❌ [DashboardService] Failed to fetch order stats:', error.message);
      throw error;
    }
  }

  /**
   * Get rider statistics
   */
  async getRiderStats(): Promise<RiderStats> {
    try {
      console.log('🚴 [DashboardService] Fetching rider statistics...');
      
      // Fetch all riders
      const riders = (await adminApiClient.get('/riders/admin/all')) as any;

      const totalRiders = riders.length;
      const activeRiders = riders.filter((r: any) => r.isActive).length;
      const inactiveRiders = totalRiders - activeRiders;
      
      // Calculate average rating
      const totalRating = riders.reduce((sum: number, r: any) => sum + (r.rating || 0), 0);
      const averageRating = totalRiders > 0 ? parseFloat((totalRating / totalRiders).toFixed(2)) : 0;

      const stats: RiderStats = {
        totalRiders,
        activeRiders,
        inactiveRiders,
        averageRating,
      };

      console.log('✅ [DashboardService] Rider stats calculated:', stats);
      return stats;
    } catch (error: any) {
      console.error('❌ [DashboardService] Failed to fetch rider stats:', error.message);
      throw error;
    }
  }

  /**
   * Get product statistics
   */
  async getProductStats(): Promise<ProductStats> {
    try {
      console.log('📦 [DashboardService] Fetching product statistics...');
      
      // Fetch all products
      const productsResponse = (await adminApiClient.get('/products')) as any;
      const products = asArray<any>(productsResponse);

      const totalProducts = products.length;
      
      // Count low stock (less than 10) and out of stock (0)
      const lowStockProducts = products.filter((p: any) => {
        const inventory = p.Inventory?.[0]?.quantity || 0;
        return inventory > 0 && inventory < 10;
      }).length;

      const outOfStockProducts = products.filter((p: any) => {
        const inventory = p.Inventory?.[0]?.quantity || 0;
        return inventory === 0;
      }).length;

      const stats: ProductStats = {
        totalProducts,
        lowStockProducts,
        outOfStockProducts,
      };

      console.log('✅ [DashboardService] Product stats calculated:', stats);
      return stats;
    } catch (error: any) {
      console.error('❌ [DashboardService] Failed to fetch product stats:', error.message);
      throw error;
    }
  }

  /**
   * Get all dashboard data at once
   */
  async getDashboardData(): Promise<DashboardData> {
    try {
      console.log('📈 [DashboardService] Fetching complete dashboard data...');
      
      // Fetch all data in parallel
      const [orderStats, riderStats, productStats] = await Promise.all([
        this.getOrderStats(),
        this.getRiderStats(),
        this.getProductStats(),
      ]);

      const dashboardData: DashboardData = {
        stats: orderStats,
        riderStats,
        productStats,
      };

      console.log('✅ [DashboardService] Complete dashboard data loaded');
      return dashboardData;
    } catch (error: any) {
      console.error('❌ [DashboardService] Failed to fetch dashboard data:', error.message);
      throw error;
    }
  }

  /**
   * Get popular products (top sellers)
   */
  async getPopularProducts(limit: number = 5): Promise<PopularProduct[]> {
    try {
      console.log('⭐ [DashboardService] Fetching popular products...');

      // Use backend dashboard stats endpoint (fast + reliable)
      const topProductsResponse = (await adminApiClient.get(
        `/admin/dashboard/top-products?limit=${limit}`
      )) as any;

      const topProducts = asArray<any>(topProductsResponse);

      const popularProducts: PopularProduct[] = topProducts.map((p: any) => ({
        id: p.productId,
        nameEnglish: p.name || 'Unknown',
        quantity: p.quantity || 0,
        revenue: p.revenue || 0,
        imageUrl: p.image,
      }));

      console.log('✅ [DashboardService] Popular products:', popularProducts);
      return popularProducts;
    } catch (error: any) {
      console.error('❌ [DashboardService] Failed to fetch popular products:', error.message);
      return [];
    }
  }

  /**
   * Get revenue breakdown by time period
   */
  async getRevenueOverTime(days: number = 7): Promise<OrderTrend[]> {
    try {
      console.log(`📊 [DashboardService] Fetching revenue data for last ${days} days...`);
      
      // Fetch all orders
      const ordersResponse = (await adminApiClient.get('/orders/admin/all')) as any;
      const orders = asArray<any>(ordersResponse);

      // Group by date
      const dateMap = new Map<string, { orders: number; revenue: number }>();

      orders.forEach((order: any) => {
        const orderDate = new Date(order.createdAt);
        const dateKey = orderDate.toISOString().split('T')[0]; // YYYY-MM-DD format

        if (!dateMap.has(dateKey)) {
          dateMap.set(dateKey, { orders: 0, revenue: 0 });
        }

        const existing = dateMap.get(dateKey)!;
        existing.orders += 1;
        
        // Only count paid orders for revenue
        if (order.paymentStatus === 'paid') {
          existing.revenue += order.total || 0;
        }
      });

      // Convert to array, sort by date, and take last N days
      const trends = Array.from(dateMap.entries())
        .map(([date, data]) => ({
          date,
          ...data,
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-days);

      console.log('✅ [DashboardService] Revenue trends:', trends);
      return trends;
    } catch (error: any) {
      console.error('❌ [DashboardService] Failed to fetch revenue trends:', error.message);
      return [];
    }
  }

  /**
   * Get active riders count
   */
  async getActiveRidersCount(): Promise<number> {
    try {
      const stats = await this.getRiderStats();
      return stats.activeRiders;
    } catch (error) {
      console.error('Failed to get active riders count:', error);
      return 0;
    }
  }

  /**
   * Get today's revenue
   */
  async getTodayRevenue(): Promise<number> {
    try {
      const stats = await this.getOrderStats();
      return stats.revenueToday;
    } catch (error) {
      console.error('Failed to get today revenue:', error);
      return 0;
    }
  }

  /**
   * Get total customers (users count)
   */
  async getTotalCustomers(): Promise<number> {
    try {
      console.log('👥 [DashboardService] Fetching total customers...');
      const users = (await adminApiClient.get('/users')) as any;
      const customers = users.filter((u: any) => u.role !== 'rider' && u.role !== 'admin').length;
      console.log('✅ [DashboardService] Total customers:', customers);
      return customers;
    } catch (error: any) {
      console.error('❌ [DashboardService] Failed to fetch customers:', error.message);
      return 0;
    }
  }
}

export default new DashboardService();
