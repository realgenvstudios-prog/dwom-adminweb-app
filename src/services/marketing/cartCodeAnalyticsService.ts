import adminApiClient from '../apiClient';
import type { CartCodeAnalytics } from './marketingTypes';
import { logger } from '../../utils/logger';

// Cart-sharing code analytics. Split out of the former monolithic
// MarketingService.
export class CartCodeAnalyticsService {
  /**
   * Get analytics for all cart sharing codes
   */
  async getAllCartCodeAnalytics(): Promise<CartCodeAnalytics[]> {
    try {
      const analytics = await adminApiClient.get<CartCodeAnalytics[]>('/marketing/codes/analytics/all');
      return analytics;
    } catch (error) {
      logger.error('❌ Failed to fetch cart code analytics:', (error as Error).message);
      return [];
    }
  }
}
