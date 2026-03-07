import adminApiClient from './apiClient';

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

export const ordersService = {
  /**
   * Create a manual order (admin only)
   */
  async createOrder(payload: any): Promise<any> {
    try {
      const response = await adminApiClient.post<any>('/orders', payload);
      return response;
    } catch (error) {
      console.error('❌ [OrdersService] Failed to create order:', error);
      throw error;
    }
  },

  /**
   * Get all orders (admin endpoint)
   */
  async getAll(): Promise<any> {
    try {
      const response = await adminApiClient.get<any>(
        `/orders/admin/all`
      );
      // Backend returns { data: orders, pagination: {...} }
      // Extract the data array directly
      const orders = response?.data || response || [];
      return orders;
    } catch (error) {
      console.error('❌ [OrdersService] Failed to fetch orders:', error);
      throw error;
    }
  },

  /**
   * Get order by ID
   */
  async getById(id: number): Promise<Order> {
    try {
      const response = await adminApiClient.get<Order>(`/orders/${id}`);
      return response;
    } catch (error) {
      console.error(`❌ [OrdersService] Failed to fetch order ${id}:`, error);
      throw error;
    }
  },

  /**
   * Update order status
   */
  async updateStatus(id: number, status: string): Promise<any> {
    try {
      const response = await adminApiClient.patch<any>(`/orders/${id}/status`, {
        status,
      });
      return response;
    } catch (error) {
      console.error(`❌ [OrdersService] Failed to update order ${id}:`, error);
      throw error;
    }
  },

  /**
   * Assign rider to order
   */
  async assignRider(orderId: number, riderId: number): Promise<any> {
    try {
      const response = await adminApiClient.post(`/orders/${orderId}/assign-rider`, {
        riderId,
      });
      return response;
    } catch (error) {
      console.error(`❌ [OrdersService] Failed to assign rider:`, error);
      throw error;
    }
  },

  /**
   * Update payment status
   */
  async updatePaymentStatus(id: number, paymentStatus: string): Promise<any> {
    try {
      const response = await adminApiClient.patch<any>(`/orders/${id}/payment-status`, {
        paymentStatus,
      });
      return response;
    } catch (error) {
      console.error(`❌ [OrdersService] Failed to update order payment status:`, error);
      throw error;
    }
  },

  /**
   * Get order statistics
   */
  async getStats(): Promise<any> {
    try {
      const response = await adminApiClient.get('/orders/stats/overview');
      return response;
    } catch (error) {
      console.error('❌ [OrdersService] Failed to fetch stats:', error);
      return {};
    }
  },
};

export default ordersService;
