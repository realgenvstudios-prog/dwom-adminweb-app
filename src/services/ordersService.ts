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
      console.log('📦 [OrdersService] Creating manual order');
      const response = await adminApiClient.post<any>('/orders', payload);
      console.log('✅ [OrdersService] Order created:', response.id);
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
      console.log('📦 [OrdersService] Fetching all orders from admin endpoint');
      const response = await adminApiClient.get<any>(
        `/orders/admin/all`
      );
      // Backend returns { data: orders, pagination: {...} }
      // Extract the data array directly
      const orders = response?.data || response || [];
      console.log('✅ [OrdersService] Orders fetched:', Array.isArray(orders) ? orders.length : 0);
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
      console.log(`📦 [OrdersService] Fetching order ${id}`);
      const response = await adminApiClient.get<Order>(`/orders/${id}`);
      console.log(`✅ [OrdersService] Order ${id} fetched`);
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
      console.log(`📦 [OrdersService] Updating order ${id} status to ${status}`);
      const response = await adminApiClient.patch<any>(`/orders/${id}/status`, {
        status,
      });
      console.log(`✅ [OrdersService] Order ${id} status updated`);
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
      console.log(`📦 [OrdersService] Assigning rider ${riderId} to order ${orderId}`);
      const response = await adminApiClient.post(`/orders/${orderId}/assign-rider`, {
        riderId,
      });
      console.log(`✅ [OrdersService] Rider assigned`);
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
      console.log(`💰 [OrdersService] Updating order ${id} payment status to ${paymentStatus}`);
      const response = await adminApiClient.patch<any>(`/orders/${id}/payment-status`, {
        paymentStatus,
      });
      console.log(`✅ [OrdersService] Order ${id} payment status updated`);
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
      console.log('📊 [OrdersService] Fetching order stats');
      const response = await adminApiClient.get('/orders/stats/overview');
      console.log('✅ [OrdersService] Stats fetched');
      return response;
    } catch (error) {
      console.error('❌ [OrdersService] Failed to fetch stats:', error);
      return {};
    }
  },
};

export default ordersService;
