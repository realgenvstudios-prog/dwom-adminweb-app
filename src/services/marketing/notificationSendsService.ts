import adminApiClient from '../apiClient';
import type { NotificationSend } from './marketingTypes';

// Bulk/broadcast notification sends. Split out of the former monolithic
// MarketingService.
export class NotificationSendsService {
  /**
   * Send bulk notification
   */
  async sendNotification(data: {
    templateId: number;
    targetZones?: number[];
    targetSubscriptionStatus?: string;
    scheduledFor?: string;
    sendNow?: boolean;
    sendPush?: boolean;
    sendSms?: boolean;
    sendEmail?: boolean;
  }): Promise<NotificationSend> {
    try {
      const send = (await adminApiClient.post('/marketing/sends', data)) as any;
      return send;
    } catch (error: any) {
      console.error('❌ Failed to send notification:', error.message);
      throw error;
    }
  }

  /**
   * Get all notification sends
   */
  async getNotificationSends(): Promise<NotificationSend[]> {
    try {
      const sends = (await adminApiClient.get('/marketing/sends')) as any;
      return sends;
    } catch (error: any) {
      console.error('❌ Failed to fetch sends:', error.message);
      throw error;
    }
  }

  /**
   * Get notification send by ID
   */
  async getNotificationSendById(id: number): Promise<NotificationSend> {
    try {
      const send = (await adminApiClient.get(`/marketing/sends/${id}`)) as any;
      return send;
    } catch (error: any) {
      console.error('❌ Failed to fetch send:', error.message);
      throw error;
    }
  }

  /**
   * Send broadcast notification via Firebase
   */
  async sendBroadcastNotification(data: {
    title: string;
    body: string;
    type?: 'promotion' | 'product_update' | 'system_message';
    data?: Record<string, string>;
  }): Promise<{ successCount: number; failureCount: number }> {
    try {
      const result = (await adminApiClient.post('/notifications/broadcast', data)) as any;
      return result;
    } catch (error: any) {
      console.error('❌ Failed to send broadcast notification:', error.message);
      throw error;
    }
  }

  /**
   * Send promotion notification to specific users
   */
  async sendPromotionNotification(data: {
    title: string;
    body: string;
    promotionId?: string;
    userIds?: string[];
  }): Promise<{ successCount: number; failureCount: number }> {
    try {
      const result = (await adminApiClient.post('/notifications/promotion', data)) as any;
      return result;
    } catch (error: any) {
      console.error('❌ Failed to send promotion notification:', error.message);
      throw error;
    }
  }

  /**
   * Send product update notification
   */
  async sendProductUpdateNotification(data: {
    title: string;
    body: string;
    productId: string;
  }): Promise<{ successCount: number; failureCount: number }> {
    try {
      const result = (await adminApiClient.post('/notifications/product-update', data)) as any;
      return result;
    } catch (error: any) {
      console.error('❌ Failed to send product update notification:', error.message);
      throw error;
    }
  }

  /**
   * Send notification to multiple users
   */
  async sendToUsers(data: {
    userIds: string[];
    title: string;
    body: string;
    type?: string;
    data?: Record<string, string>;
  }): Promise<{ successCount: number; failureCount: number }> {
    try {
      const result = (await adminApiClient.post('/notifications/send-to-users', data)) as any;
      return result;
    } catch (error: any) {
      console.error('❌ Failed to send notification to users:', error.message);
      throw error;
    }
  }
}
