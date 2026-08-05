import adminApiClient from './apiClient';

export interface Campaign {
  id: number;
  name: string;
  description?: string;
  channel: 'social' | 'sms' | 'email' | 'in_app' | 'push';
  objective: 'awareness' | 'conversion' | 'retention' | 'engagement';
  status: 'draft' | 'active' | 'paused' | 'ended';
  startDate: string;
  endDate?: string;
  budget?: number;
  actualSpend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  cac: number;
  roas: number;
  content: string;
  imageUrl?: string;
  title?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationTemplate {
  id: number;
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
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationSend {
  id: number;
  templateId: number;
  status: 'scheduled' | 'sending' | 'sent' | 'failed';
  scheduledFor?: string;
  sentAt?: string;
  totalRecipients: number;
  successCount: number;
  failureCount: number;
  readCount: number;
  clickCount: number;
  createdAt: string;
}

export interface CartCodeAnalytics {
  id: number;
  code: string;
  creator: string;
  creatorId: number;
  totalShares: number;
  totalUsages: number;
  uniqueUsers: number;
  totalRevenue: number;
  lastUsedAt?: string;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
}

export interface CampaignMetrics {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
  avgRoas: number;
  activeCampaigns: number;
}

class MarketingService {
  /**
   * Get campaign metrics overview
   */
  async getCampaignMetrics(): Promise<CampaignMetrics> {
    try {
      const metrics = (await adminApiClient.get('/marketing/campaigns/metrics/overview')) as any;
      return metrics;
    } catch (error: any) {
      console.error('❌ Failed to fetch campaign metrics:', error.message);
      throw error;
    }
  }

  /**
   * Get all campaigns with optional filters
   */
  async getCampaigns(status?: string, channel?: string): Promise<Campaign[]> {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (channel) params.append('channel', channel);
      
      const url = params.toString() ? `/marketing/campaigns?${params.toString()}` : '/marketing/campaigns';
      const campaigns = (await adminApiClient.get(url)) as any;
      return campaigns;
    } catch (error: any) {
      console.error('❌ Failed to fetch campaigns:', error.message);
      throw error;
    }
  }

  /**
   * Get campaign by ID
   */
  async getCampaignById(id: number): Promise<Campaign> {
    try {
      const campaign = (await adminApiClient.get(`/marketing/campaigns/${id}`)) as any;
      return campaign;
    } catch (error: any) {
      console.error('❌ Failed to fetch campaign:', error.message);
      throw error;
    }
  }

  /**
   * Create a new campaign
   */
  async createCampaign(data: {
    name: string;
    description?: string;
    channel: string;
    objective: string;
    startDate: string;
    endDate?: string;
    budget?: number;
    title?: string;
    content: string;
    imageUrl?: string;
    cta?: string;
    ctaLink?: string;
  }): Promise<Campaign> {
    try {
      const campaign = (await adminApiClient.post('/marketing/campaigns', data)) as any;
      return campaign;
    } catch (error: any) {
      console.error('❌ Failed to create campaign:', error.message);
      throw error;
    }
  }

  /**
   * Update campaign
   */
  async updateCampaign(
    id: number,
    data: {
      name?: string;
      status?: string;
      title?: string;
      content?: string;
      imageUrl?: string;
      budget?: number;
      actualSpend?: number;
      impressions?: number;
      clicks?: number;
      conversions?: number;
      cac?: number;
      roas?: number;
    }
  ): Promise<Campaign> {
    try {
      const campaign = (await adminApiClient.patch(`/marketing/campaigns/${id}`, data)) as any;
      return campaign;
    } catch (error: any) {
      console.error('❌ Failed to update campaign:', error.message);
      throw error;
    }
  }

  /**
   * Delete campaign
   */
  async deleteCampaign(id: number): Promise<{ message: string }> {
    try {
      const result = (await adminApiClient.delete(`/marketing/campaigns/${id}`)) as any;
      return result;
    } catch (error: any) {
      console.error('❌ Failed to delete campaign:', error.message);
      throw error;
    }
  }

  /**
   * Actually dispatches a draft campaign per its channel (push/in-app/SMS
   * send for real; email errors until a provider is configured; social is
   * marked active only, since posting there isn't automated).
   */
  async launchCampaign(id: number): Promise<{ totalRecipients: number; successCount: number; failureCount: number; status: string }> {
    try {
      const result = (await adminApiClient.post(`/marketing/campaigns/${id}/launch`, {})) as any;
      return result;
    } catch (error: any) {
      console.error('❌ Failed to launch campaign:', error.message);
      throw error;
    }
  }

  // ==================== NOTIFICATION TEMPLATES ====================

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

  // ==================== NOTIFICATION SENDS ====================

  /**
   * Send bulk notification
   */
  async sendNotification(data: {
    templateId: number;
    targetZones?: number[];
    targetSubscriptionStatus?: string;
    scheduledFor?: string;
    sendNow?: boolean;
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

  // ==================== CART CODE ANALYTICS ====================

  /**
   * Get analytics for all cart sharing codes
   */
  async getAllCartCodeAnalytics(): Promise<CartCodeAnalytics[]> {
    try {
      const analytics = (await adminApiClient.get('/marketing/codes/analytics/all')) as any;
      return analytics;
    } catch (error: any) {
      console.error('❌ Failed to fetch cart code analytics:', error.message);
      return [];
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

export default new MarketingService();
