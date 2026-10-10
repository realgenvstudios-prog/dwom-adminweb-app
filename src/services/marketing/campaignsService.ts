import adminApiClient from '../apiClient';
import type { Campaign, CampaignMetrics } from './marketingTypes';
import { logger } from '../../utils/logger';

// Campaign CRUD + launch. Split out of the former monolithic
// MarketingService.
export class CampaignsService {
  /**
   * Get campaign metrics overview
   */
  async getCampaignMetrics(): Promise<CampaignMetrics> {
    try {
      const metrics = await adminApiClient.get<CampaignMetrics>('/marketing/campaigns/metrics/overview');
      return metrics;
    } catch (error) {
      logger.error('❌ Failed to fetch campaign metrics:', (error as Error).message);
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
      const campaigns = await adminApiClient.get<Campaign[]>(url);
      return campaigns;
    } catch (error) {
      logger.error('❌ Failed to fetch campaigns:', (error as Error).message);
      throw error;
    }
  }

  /**
   * Get campaign by ID
   */
  async getCampaignById(id: number): Promise<Campaign> {
    try {
      const campaign = await adminApiClient.get<Campaign>(`/marketing/campaigns/${id}`);
      return campaign;
    } catch (error) {
      logger.error('❌ Failed to fetch campaign:', (error as Error).message);
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
      const campaign = await adminApiClient.post<Campaign>('/marketing/campaigns', data);
      return campaign;
    } catch (error) {
      logger.error('❌ Failed to create campaign:', (error as Error).message);
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
      const campaign = await adminApiClient.patch<Campaign>(`/marketing/campaigns/${id}`, data);
      return campaign;
    } catch (error) {
      logger.error('❌ Failed to update campaign:', (error as Error).message);
      throw error;
    }
  }

  /**
   * Delete campaign
   */
  async deleteCampaign(id: number): Promise<{ message: string }> {
    try {
      const result = await adminApiClient.delete<{ message: string }>(`/marketing/campaigns/${id}`);
      return result;
    } catch (error) {
      logger.error('❌ Failed to delete campaign:', (error as Error).message);
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
      const result = await adminApiClient.post<{ totalRecipients: number; successCount: number; failureCount: number; status: string }>(`/marketing/campaigns/${id}/launch`, {});
      return result;
    } catch (error) {
      logger.error('❌ Failed to launch campaign:', (error as Error).message);
      throw error;
    }
  }
}
