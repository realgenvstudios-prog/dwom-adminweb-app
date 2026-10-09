import adminApiClient from '../apiClient';
import type { NotificationTemplate } from './marketingTypes';

// Notification template CRUD. Split out of the former monolithic
// MarketingService.
export class NotificationTemplatesService {
  /**
   * Get all push notification templates
   */
  async getTemplates(): Promise<NotificationTemplate[]> {
    try {
      const templates = (await adminApiClient.get('/marketing/templates')) as any;
      return templates;
    } catch (error: any) {
      console.error('❌ Failed to fetch templates:', error.message);
      throw error;
    }
  }

  /**
   * Get template by ID
   */
  async getTemplateById(id: number): Promise<NotificationTemplate> {
    try {
      const template = (await adminApiClient.get(`/marketing/templates/${id}`)) as any;
      return template;
    } catch (error: any) {
      console.error('❌ Failed to fetch template:', error.message);
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
      const template = (await adminApiClient.post('/marketing/templates', data)) as any;
      return template;
    } catch (error: any) {
      console.error('❌ Failed to create template:', error.message);
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
      const template = (await adminApiClient.patch(`/marketing/templates/${id}`, data)) as any;
      return template;
    } catch (error: any) {
      console.error('❌ Failed to update template:', error.message);
      throw error;
    }
  }

  /**
   * Delete notification template
   */
  async deleteTemplate(id: number): Promise<{ message: string }> {
    try {
      const result = (await adminApiClient.delete(`/marketing/templates/${id}`)) as any;
      return result;
    } catch (error: any) {
      console.error('❌ Failed to delete template:', error.message);
      throw error;
    }
  }
}
