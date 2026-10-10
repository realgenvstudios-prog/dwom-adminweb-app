import adminApiClient from './apiClient';
import { logger } from '../utils/logger';
import type { RiderData } from './ridersService';
import type { Product } from './productsService';
import type { AdminOrderSummary } from './ordersService';

function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object' && Array.isArray((value as { data?: unknown }).data)) {
    return (value as { data: T[] }).data;
  }
  return [];
}

// /products includes each product's inventory row, which Product (from
// productsService) doesn't model since most consumers don't need it.
interface ProductWithInventory extends Product {
  Inventory?: Array<{ quantity: number }>;
}

interface TopProductSummary {
  productId: number;
  name?: string;
  quantity?: number;
  revenue?: number;
  image?: string;
}

interface DashboardUser {
  id: number;
  role: string;
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

      // Prefer admin dashboard stats endpoint for consistency
      const response = await adminApiClient.get<DashboardStats>('/admin/dashboard/orders');
      return response;
    } catch (error) {
      logger.error('❌ [DashboardService] Failed to fetch order stats:', (error as Error).message);
      throw error;
    }
  }

  /**
   * Get rider statistics
   */
  async getRiderStats(): Promise<RiderStats> {
    try {
      
      // Fetch all riders
      const riders = asArray<RiderData>(await adminApiClient.get('/riders/admin/all'));

      const totalRiders = riders.length;
      const activeRiders = riders.filter((r) => r.isActive).length;
      const inactiveRiders = totalRiders - activeRiders;
      
      // Calculate average rating
      const totalRating = riders.reduce((sum: number, r) => sum + (r.rating || 0), 0);
      const averageRating = totalRiders > 0 ? parseFloat((totalRating / totalRiders).toFixed(2)) : 0;

      const stats: RiderStats = {
        totalRiders,
        activeRiders,
        inactiveRiders,
        averageRating,
      };

      return stats;
    } catch (error) {
      logger.error('❌ [DashboardService] Failed to fetch rider stats:', (error as Error).message);
      throw error;
    }
  }

  /**
   * Get product statistics
   */
  async getProductStats(): Promise<ProductStats> {
    try {
      
      // Fetch all products
      const products = asArray<ProductWithInventory>(await adminApiClient.get('/products'));

      const totalProducts = products.length;
      
      // Count low stock (less than 10) and out of stock (0)
      const lowStockProducts = products.filter((p) => {
        const inventory = p.Inventory?.[0]?.quantity || 0;
        return inventory > 0 && inventory < 10;
      }).length;

      const outOfStockProducts = products.filter((p) => {
        const inventory = p.Inventory?.[0]?.quantity || 0;
        return inventory === 0;
      }).length;

      const stats: ProductStats = {
        totalProducts,
        lowStockProducts,
        outOfStockProducts,
      };

      return stats;
    } catch (error) {
      logger.error('❌ [DashboardService] Failed to fetch product stats:', (error as Error).message);
      throw error;
    }
  }

  /**
   * Get all dashboard data at once
   */
  async getDashboardData(): Promise<DashboardData> {
    try {
      
      // Fetch all data in parallel - use allSettled so one failure doesn't block the rest
      const [orderResult, riderResult, productResult] = await Promise.allSettled([
        this.getOrderStats(),
        this.getRiderStats(),
        this.getProductStats(),
      ]);

      const dashboardData: DashboardData = {
        stats: orderResult.status === 'fulfilled' ? orderResult.value : {
          totalOrdersToday: 0, completedOrders: 0, canceledOrders: 0, revenueToday: 0, allOrdersCount: 0,
        },
        riderStats: riderResult.status === 'fulfilled' ? riderResult.value : {
          totalRiders: 0, activeRiders: 0, inactiveRiders: 0, averageRating: 0,
        },
        productStats: productResult.status === 'fulfilled' ? productResult.value : {
          totalProducts: 0, lowStockProducts: 0, outOfStockProducts: 0,
        },
      };

      return dashboardData;
    } catch (error) {
      logger.error('❌ [DashboardService] Failed to fetch dashboard data:', (error as Error).message);
      throw error;
    }
  }

  /**
   * Get popular products (top sellers)
   */
  async getPopularProducts(limit: number = 5): Promise<PopularProduct[]> {
    try {

      // Use backend dashboard stats endpoint (fast + reliable)
      const topProductsResponse = await adminApiClient.get(
        `/admin/dashboard/top-products?limit=${limit}`
      );

      const topProducts = asArray<TopProductSummary>(topProductsResponse);

      const popularProducts: PopularProduct[] = topProducts.map((p) => ({
        id: p.productId,
        nameEnglish: p.name || 'Unknown',
        quantity: p.quantity || 0,
        revenue: p.revenue || 0,
        imageUrl: p.image,
      }));

      return popularProducts;
    } catch (error) {
      logger.error('❌ [DashboardService] Failed to fetch popular products:', (error as Error).message);
      return [];
    }
  }

  /**
   * Get revenue breakdown by time period
   */
  async getRevenueOverTime(days: number = 7): Promise<OrderTrend[]> {
    try {
      
      // Fetch all orders
      const orders = asArray<AdminOrderSummary>(await adminApiClient.get('/orders/admin/all'));

      // Group by date
      const dateMap = new Map<string, { orders: number; revenue: number }>();

      orders.forEach((order) => {
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

      return trends;
    } catch (error) {
      logger.error('❌ [DashboardService] Failed to fetch revenue trends:', (error as Error).message);
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
      logger.error('Failed to get active riders count:', error);
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
      logger.error('Failed to get today revenue:', error);
      return 0;
    }
  }

  /**
   * Get total customers (users count)
   */
  async getTotalCustomers(): Promise<number> {
    try {
      const users = asArray<DashboardUser>(await adminApiClient.get('/users'));
      const customers = users.filter((u) => u.role !== 'rider' && u.role !== 'admin').length;
      return customers;
    } catch (error) {
      logger.error('❌ [DashboardService] Failed to fetch customers:', (error as Error).message);
      return 0;
    }
  }
}

export default new DashboardService();
