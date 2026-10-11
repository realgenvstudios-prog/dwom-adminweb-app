import adminApiClient from './apiClient';
import { logger } from '../utils/logger';

export interface EventCount {
  name: string;
  count: number;
}

class AnalyticsService {
  /**
   * Event counts by name for a date range. Defaults to the last 7 days —
   * matches the backend's own default when from/to are omitted.
   */
  async getSummary(from?: Date, to?: Date): Promise<EventCount[]> {
    try {
      const params = new URLSearchParams();
      if (from) params.append('from', from.toISOString());
      if (to) params.append('to', to.toISOString());
      const query = params.toString() ? `?${params.toString()}` : '';
      return await adminApiClient.get<EventCount[]>(`/analytics/summary${query}`);
    } catch (error) {
      logger.error('❌ [AnalyticsService] Failed to fetch summary:', error);
      return [];
    }
  }
}

export default new AnalyticsService();
