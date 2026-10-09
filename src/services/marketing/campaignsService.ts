import adminApiClient from '../apiClient';
import type { Campaign, CampaignMetrics } from './marketingTypes';

// Campaign CRUD + launch. Split out of the former monolithic
// MarketingService.
export class CampaignsService {
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
}
