import adminApiClient from './apiClient';
import { logger } from '../utils/logger';

export interface Order {
  id: number;
  userId: number;
  status: string;
  totalPrice: number;
  items: any[];
  deliveryAddress?: any;
  rider?: any;
  createdAt: string;
  updatedAt: string;
}

// Matches the Prisma `select` in the backend's findAllForAdmin() — the shape
// GET /orders/admin/all actually returns, consumed here and by finance/
// dashboard services. Note: no Zone relation is selected server-side, so
// any `.Zone` access on this type is always undefined today.
export interface AdminOrderSummary {
  id: number;
  userId: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  total: number;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  smallOrderFee?: number;
  packagingName?: string | null;
  packagingFee?: number;
  couponDiscount: number;
  createdAt: string;
  updatedAt: string;
  User?: { id: number; name: string; phoneNumber: string };
  Address?: { id: number; addressText: string; label: string; placeName?: string | null; plusCode?: string | null; lat?: number | null; lng?: number | null };
  /** Delivery zone resolved at checkout (null for orders placed before zones were saved). */
  Zone?: { id: number; name: string } | null;
  Rider?: { id: number; rating: number | null; User?: { name: string } };
  RiderRating?: Array<{ id: number; rating: number; comment: string | null }>;
  ProductReview?: Array<{
    id: number;
    rating: number;
    comment: string | null;
    productId: number;
    Product?: { nameEnglish: string; nameFrench: string | null };
  }>;
  _count?: { OrderItem: number; BundleOrderItem: number };
}

interface OrderStats {
  totalOrdersToday: number;
  completedOrders: number;
  canceledOrders: number;
  revenueToday: number;
}

interface CreateOrderPayload {
  userId: number;
  deliveryAddressId: number;
  paymentMethod: string;
  riderNotes?: string;
  items: Array<{ productId: number; quantity: number }>;
}

export const ordersService = {
  /**
   * Create a manual order (admin only)
   */
  async createOrder(payload: CreateOrderPayload): Promise<AdminOrderSummary> {
    try {
      const response = await adminApiClient.post<AdminOrderSummary>('/orders', payload);
      return response;
    } catch (error) {
      logger.error('❌ [OrdersService] Failed to create order:', error);
      throw error;
    }
  },

  /**
   * Get all orders (admin endpoint)
   */
  async getAll(): Promise<AdminOrderSummary[]> {
    // The server pages this list; fetch every page (it used to load only
    // page 1, i.e. the newest 50 orders, so older ones never appeared).
    try {
      const all: AdminOrderSummary[] = [];
      for (let page = 1; page <= 50; page++) {
        const response = await adminApiClient.get<{ data: AdminOrderSummary[]; pagination?: { totalPages: number } } | AdminOrderSummary[]>(
          `/orders/admin/all?page=${page}&pageSize=500`,
        );
        if (Array.isArray(response)) return response;
        all.push(...(response?.data || []));
        if (!response?.pagination || page >= response.pagination.totalPages) break;
      }
      return all;
    } catch (error) {
      logger.error('❌ [OrdersService] Failed to fetch orders:', error);
      throw error;
    }
  },

  /** The newest orders (one page) — used to poll for new ones without reloading everything. */
  async getLatest(limit = 50): Promise<AdminOrderSummary[]> {
    const response = await adminApiClient.get<{ data: AdminOrderSummary[] } | AdminOrderSummary[]>(`/orders/admin/all?page=1&pageSize=${limit}`);
    return Array.isArray(response) ? response : response?.data || [];
  },

  /**
   * Get order by ID
   */
  async getById(id: number): Promise<Order> {
    try {
      const response = await adminApiClient.get<Order>(`/orders/${id}`);
      return response;
    } catch (error) {
      logger.error(`❌ [OrdersService] Failed to fetch order ${id}:`, error);
      throw error;
    }
  },

  /**
   * Update order status
   */
  /** Cancelled after pickup: the groceries are back at the pickup point. */
  async goodsReturned(id: number): Promise<unknown> {
    return adminApiClient.post(`/orders/${id}/goods-returned`);
  },

  /** Packed and waiting for the rider; the note is shown to the rider (e.g. "fish, keep cold"). */
  async markReady(id: number, handlingNote?: string): Promise<unknown> {
    return adminApiClient.post(`/orders/${id}/ready`, { handlingNote: handlingNote || undefined });
  },

  async updateStatus(id: number, status: string, notes?: string): Promise<unknown> {
    try {
      const response = await adminApiClient.patch(`/orders/${id}/status`, {
        status,
        ...(notes ? { notes } : {}),
      });
      return response;
    } catch (error) {
      logger.error(`❌ [OrdersService] Failed to update order ${id}:`, error);
      throw error;
    }
  },

  /**
   * Assign rider to order
   */
  async assignRider(orderId: number, riderId: number): Promise<unknown> {
    try {
      const response = await adminApiClient.post(`/orders/${orderId}/assign-rider`, {
        riderId,
      });
      return response;
    } catch (error) {
      logger.error(`❌ [OrdersService] Failed to assign rider:`, error);
      throw error;
    }
  },

  /**
   * Assign picker (kayayie/worker) to order
   */
  async assignPicker(orderId: number, workerId: number): Promise<unknown> {
    try {
      const response = await adminApiClient.post(`/orders/${orderId}/assign-picker`, {
        workerId,
      });
      return response;
    } catch (error) {
      logger.error(`❌ [OrdersService] Failed to assign picker:`, error);
      throw error;
    }
  },

  /**
   * Update payment status
   */
  async updatePaymentStatus(id: number, paymentStatus: string): Promise<unknown> {
    try {
      const response = await adminApiClient.patch(`/orders/${id}/payment-status`, {
        paymentStatus,
      });
      return response;
    } catch (error) {
      logger.error(`❌ [OrdersService] Failed to update order payment status:`, error);
      throw error;
    }
  },

  /**
   * Get order statistics
   */
  async getStats(): Promise<OrderStats> {
    try {
      const response = await adminApiClient.get<OrderStats>('/orders/stats/overview');
      return response;
    } catch (error) {
      logger.error('❌ [OrdersService] Failed to fetch stats:', error);
      return { totalOrdersToday: 0, completedOrders: 0, canceledOrders: 0, revenueToday: 0 };
    }
  },
};

export default ordersService;
