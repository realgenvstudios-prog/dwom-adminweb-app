import adminApiClient from './apiClient';
import { logger } from '../utils/logger';

export interface EventCount {
  name: string;
  count: number;
}

/** GET /analytics/insights — see the backend AnalyticsService.getInsights. */
export interface AnalyticsInsights {
  from: string;
  to: string;
  totals: {
    events: number;
    sessions: number;
    activeCustomers: number;
    guestSessions: number;
    orders: number;
    paymentsSucceeded: number;
    paymentsFailed: number;
    searches: number;
  };
  /** Distinct app sessions reaching each step (orders: customer orders). */
  funnel: { step: string; label: string; sessions: number }[];
  daily: { date: string; sessions: number; orders: number }[];
  topSearches: { query: string; count: number; zeroResults: number }[];
  missedSearches: { query: string; count: number; zeroResults: number }[];
  topScreens: { screen: string; views: number }[];
  platforms: { platform: string; sessions: number }[];
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

  async getInsights(from: Date, to: Date): Promise<AnalyticsInsights> {
    const params = new URLSearchParams({ from: from.toISOString(), to: to.toISOString() });
    return adminApiClient.get<AnalyticsInsights>(`/analytics/insights?${params.toString()}`);
  }
}

export default new AnalyticsService();
