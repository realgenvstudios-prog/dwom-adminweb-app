import adminApiClient from '../apiClient';
import type { NotificationTemplate } from './marketingTypes';
import { logger } from '../../utils/logger';

// Notification template CRUD. Split out of the former monolithic
// MarketingService.
export class NotificationTemplatesService {
  /**
   * Get all push notification templates
   */
  async getTemplates(): Promise<NotificationTemplate[]> {
    try {
      const templates = await adminApiClient.get<NotificationTemplate[]>('/marketing/templates');
      return templates;
    } catch (error) {
      logger.error('❌ Failed to fetch templates:', (error as Error).message);
      throw error;
    }
  }

  /**
   * Get template by ID
   */
  async getTemplateById(id: number): Promise<NotificationTemplate> {
    try {
      const template = await adminApiClient.get<NotificationTemplate>(`/marketing/templates/${id}`);
      return template;
    } catch (error) {
      logger.error('❌ Failed to fetch template:', (error as Error).message);
      throw error;
    }
  }

  /**
   * Create notification template
   */
  async createTemplate(data: {
    name: string;
    description?: string;
    title: string;
    body: string;
    imageUrl?: string;
    actionUrl?: string;
    inAppTitle?: string;
    inAppBody?: string;
    inAppImageUrl?: string;
    inAppCtaText?: string;
    inAppCtaLink?: string;
  }): Promise<NotificationTemplate> {
    try {
      const template = await adminApiClient.post<NotificationTemplate>('/marketing/templates', data);
      return template;
    } catch (error) {
      logger.error('❌ Failed to create template:', (error as Error).message);
      throw error;
    }
  }

  /**
   * Update notification template
   */
  async updateTemplate(
    id: number,
    data: {
      name?: string;
      description?: string;
      title?: string;
      body?: string;
      imageUrl?: string;
      actionUrl?: string;
      inAppTitle?: string;
      inAppBody?: string;
      inAppImageUrl?: string;
      inAppCtaText?: string;
      inAppCtaLink?: string;
      isActive?: boolean;
    }
  ): Promise<NotificationTemplate> {
    try {
      const template = await adminApiClient.patch<NotificationTemplate>(`/marketing/templates/${id}`, data);
      return template;
    } catch (error) {
      logger.error('❌ Failed to update template:', (error as Error).message);
      throw error;
    }
  }

  /**
   * Delete notification template
   */
  async deleteTemplate(id: number): Promise<{ message: string }> {
    try {
      const result = await adminApiClient.delete<{ message: string }>(`/marketing/templates/${id}`);
      return result;
    } catch (error) {
      logger.error('❌ Failed to delete template:', (error as Error).message);
      throw error;
    }
  }
}
