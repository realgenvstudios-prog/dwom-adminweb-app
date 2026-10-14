import adminApiClient from '../apiClient';
import type { NotificationSend } from './marketingTypes';
import { logger } from '../../utils/logger';

// Bulk/broadcast notification sends. Split out of the former monolithic
// MarketingService.
export class NotificationSendsService {
  /**
   * Send bulk notification
   */
  async sendNotification(data: {
    /** A saved template, or a title + body written for this send. */
    templateId?: number;
    title?: string;
    body?: string;
    /** Chosen customers, or a saved group. Either replaces the zone/subscription filters. */
    targetUserIds?: number[];
    groupId?: number;
    targetZones?: number[];
    targetSubscriptionStatus?: string;
    scheduledFor?: string;
    sendNow?: boolean;
    sendPush?: boolean;
    sendSms?: boolean;
    sendEmail?: boolean;
  }): Promise<NotificationSend> {
    try {
      const send = await adminApiClient.post<NotificationSend>('/marketing/sends', data);
      return send;
    } catch (error) {
      logger.error('❌ Failed to send notification:', (error as Error).message);
      throw error;
    }
  }

  /**
   * Get all notification sends
   */
  async getNotificationSends(): Promise<NotificationSend[]> {
    try {
      const sends = await adminApiClient.get<NotificationSend[]>('/marketing/sends');
      return sends;
    } catch (error) {
      logger.error('❌ Failed to fetch sends:', (error as Error).message);
      throw error;
    }
  }

  /**
   * Get notification send by ID
   */
  async getNotificationSendById(id: number): Promise<NotificationSend> {
    try {
      const send = await adminApiClient.get<NotificationSend>(`/marketing/sends/${id}`);
      return send;
    } catch (error) {
      logger.error('❌ Failed to fetch send:', (error as Error).message);
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
      const result = await adminApiClient.post<{ successCount: number; failureCount: number }>('/notifications/broadcast', data);
      return result;
    } catch (error) {
      logger.error('❌ Failed to send broadcast notification:', (error as Error).message);
      throw error;
    }
  }

  /**
   * Send promotion notification to specific users
   */
  async sendPromotionNotification(data: { title: string; body: string; promotionId?: string; userIds?: string[] }): Promise<{ successCount: number; failureCount: number }> {
    try {
      const result = await adminApiClient.post<{ successCount: number; failureCount: number }>('/notifications/promotion', data);
      return result;
    } catch (error) {
      logger.error('❌ Failed to send promotion notification:', (error as Error).message);
      throw error;
    }
  }

  /**
   * Send product update notification
   */
  async sendProductUpdateNotification(data: { title: string; body: string; productId: string }): Promise<{ successCount: number; failureCount: number }> {
    try {
      const result = await adminApiClient.post<{ successCount: number; failureCount: number }>('/notifications/product-update', data);
      return result;
    } catch (error) {
      logger.error('❌ Failed to send product update notification:', (error as Error).message);
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
      const result = await adminApiClient.post<{ successCount: number; failureCount: number }>('/notifications/send-to-users', data);
      return result;
    } catch (error) {
      logger.error('❌ Failed to send notification to users:', (error as Error).message);
      throw error;
    }
  }
}
