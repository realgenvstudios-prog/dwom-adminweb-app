import type { Campaign, NotificationTemplate, NotificationSend, CartCodeAnalytics, CampaignMetrics } from './marketing/marketingTypes';
import { CampaignsService } from './marketing/campaignsService';
import { NotificationTemplatesService } from './marketing/notificationTemplatesService';
import { NotificationSendsService } from './marketing/notificationSendsService';
import { CartCodeAnalyticsService } from './marketing/cartCodeAnalyticsService';

export type { Campaign, NotificationTemplate, NotificationSend, CartCodeAnalytics, CampaignMetrics };

// Composes campaigns, notification templates, notification sends, and
// cart-code analytics into the same flat public API this service exposed
// before the split — no changes needed at any call site. Split out of
// the former monolithic MarketingService.
class MarketingService {
  private campaigns = new CampaignsService();
  private templates = new NotificationTemplatesService();
  private sends = new NotificationSendsService();
  private cartCodes = new CartCodeAnalyticsService();

  // ==================== CAMPAIGNS ====================

  getCampaignMetrics(): Promise<CampaignMetrics> {
    return this.campaigns.getCampaignMetrics();
  }

  getCampaigns(status?: string, channel?: string): Promise<Campaign[]> {
    return this.campaigns.getCampaigns(status, channel);
  }

  getCampaignById(id: number): Promise<Campaign> {
    return this.campaigns.getCampaignById(id);
  }

  createCampaign(data: Parameters<CampaignsService['createCampaign']>[0]): Promise<Campaign> {
    return this.campaigns.createCampaign(data);
  }

  updateCampaign(id: number, data: Parameters<CampaignsService['updateCampaign']>[1]): Promise<Campaign> {
    return this.campaigns.updateCampaign(id, data);
  }

  deleteCampaign(id: number): Promise<{ message: string }> {
    return this.campaigns.deleteCampaign(id);
  }

  launchCampaign(id: number): Promise<{ totalRecipients: number; successCount: number; failureCount: number; status: string }> {
    return this.campaigns.launchCampaign(id);
  }

  // ==================== NOTIFICATION TEMPLATES ====================

  getTemplates(): Promise<NotificationTemplate[]> {
    return this.templates.getTemplates();
  }

  getTemplateById(id: number): Promise<NotificationTemplate> {
    return this.templates.getTemplateById(id);
  }

  createTemplate(data: Parameters<NotificationTemplatesService['createTemplate']>[0]): Promise<NotificationTemplate> {
    return this.templates.createTemplate(data);
  }

  updateTemplate(id: number, data: Parameters<NotificationTemplatesService['updateTemplate']>[1]): Promise<NotificationTemplate> {
    return this.templates.updateTemplate(id, data);
  }

  deleteTemplate(id: number): Promise<{ message: string }> {
    return this.templates.deleteTemplate(id);
  }

  // ==================== NOTIFICATION SENDS ====================

  sendNotification(data: Parameters<NotificationSendsService['sendNotification']>[0]): Promise<NotificationSend> {
    return this.sends.sendNotification(data);
  }

  getNotificationSends(): Promise<NotificationSend[]> {
    return this.sends.getNotificationSends();
  }

  getNotificationSendById(id: number): Promise<NotificationSend> {
    return this.sends.getNotificationSendById(id);
  }

  sendBroadcastNotification(data: Parameters<NotificationSendsService['sendBroadcastNotification']>[0]): Promise<{ successCount: number; failureCount: number }> {
    return this.sends.sendBroadcastNotification(data);
  }

  sendPromotionNotification(data: Parameters<NotificationSendsService['sendPromotionNotification']>[0]): Promise<{ successCount: number; failureCount: number }> {
    return this.sends.sendPromotionNotification(data);
  }

  sendProductUpdateNotification(data: Parameters<NotificationSendsService['sendProductUpdateNotification']>[0]): Promise<{ successCount: number; failureCount: number }> {
    return this.sends.sendProductUpdateNotification(data);
  }

  sendToUsers(data: Parameters<NotificationSendsService['sendToUsers']>[0]): Promise<{ successCount: number; failureCount: number }> {
    return this.sends.sendToUsers(data);
  }

  // ==================== CART CODE ANALYTICS ====================

  getAllCartCodeAnalytics(): Promise<CartCodeAnalytics[]> {
    return this.cartCodes.getAllCartCodeAnalytics();
  }
}

export default new MarketingService();
