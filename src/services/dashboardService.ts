import adminApiClient from './apiClient';

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
      const response = await adminApiClient.get<DashboardStats>('/orders/stats/overview');
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
      const products = (await adminApiClient.get('/products')) as any;

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
      
      // Fetch all orders with items AND all products for image data
      const [orders, allProducts] = await Promise.all([
        (adminApiClient.get('/orders/admin/all')) as Promise<any>,
        (adminApiClient.get('/products')) as Promise<any>,
      ]);

      // Create product map with images
      const productImageMap = new Map<number, string>();
      allProducts.forEach((product: any) => {
        if (product.id && product.imageUrl) {
          productImageMap.set(product.id, product.imageUrl);
        }
      });

      // Group products by sales
      const productMap = new Map<number, { nameEnglish: string; quantity: number; revenue: number; imageUrl?: string }>();

      orders.forEach((order: any) => {
        if (order.OrderItem && Array.isArray(order.OrderItem)) {
          order.OrderItem.forEach((item: any) => {
            if (!productMap.has(item.productId)) {
              productMap.set(item.productId, {
                nameEnglish: item.Product?.nameEnglish || 'Unknown',
                quantity: 0,
                revenue: 0,
                imageUrl: productImageMap.get(item.productId),
              });
            }

            const existing = productMap.get(item.productId)!;
            existing.quantity += item.quantity || 0;
            existing.revenue += item.totalPrice || 0;
          });
        }
      });

      // Convert to array and sort by quantity
      const popularProducts = Array.from(productMap.entries())
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, limit);

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
      const orders = (await adminApiClient.get('/orders/admin/all')) as any;

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

  /**
   * Get all notes for admin tracking
   */
  async getAllNotes(skip: number = 0, take: number = 50, status?: string, userId?: number): Promise<any> {
    try {
      console.log('📝 [DashboardService] Fetching notes data...');
      let url = `/notes/admin/all?skip=${skip}&take=${take}`;
      if (status) url += `&status=${status}`;
      if (userId) url += `&userId=${userId}`;
      
      const response = await adminApiClient.get(url);
      console.log('✅ [DashboardService] Notes loaded:', response);
      return response;
    } catch (error: any) {
      console.error('❌ [DashboardService] Failed to fetch notes:', error.message);
      return { notes: [], total: 0 };
    }
  }

  /**
   * Get notes analytics
   */
  async getNotesAnalytics(limit: number = 100): Promise<any> {
    try {
      console.log('📊 [DashboardService] Fetching notes analytics...');
      const response = await adminApiClient.get(`/notes/admin/analytics?limit=${limit}`);
      console.log('✅ [DashboardService] Notes analytics loaded:', response);
      return response;
    } catch (error: any) {
      console.error('❌ [DashboardService] Failed to fetch notes analytics:', error.message);
      return {
        stats: {},
        commonSearches: [],
        errorNotes: [],
        lowConfidenceMatches: [],
      };
    }
  }
}

export default new DashboardService();
