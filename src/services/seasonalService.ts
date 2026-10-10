import adminApiClient from './apiClient';
import type { Product } from './productsService';
import { logger } from '../utils/logger';

const BASE_URL = '/seasonal';

interface SeasonalConfig {
  bannerImageUrls?: string[];
  rotationFrequency: 'daily' | 'weekly' | 'monthly';
  featuredProductId: number;
}

function unwrap<T>(response: { data?: T } | T): T | undefined {
  return response && typeof response === 'object' && 'data' in response
    ? (response as { data?: T }).data
    : (response as T);
}

const seasonalService = {
  // Get all seasonal products
  async getSeasonalProducts(): Promise<Product[]> {
    try {
      const response = await adminApiClient.get<{ data?: Product[] } | Product[]>(`${BASE_URL}/products`);
      return unwrap(response) || [];
    } catch (error) {
      logger.error('Failed to fetch seasonal products:', error);
      return [];
    }
  },

  // Get featured seasonal product
  async getFeaturedSeasonalProduct(): Promise<Product | null> {
    try {
      const response = await adminApiClient.get<{ data?: Product } | Product>(`${BASE_URL}/featured`);
      return unwrap(response) || null;
    } catch (error) {
      logger.error('Failed to fetch featured product:', error);
      return null;
    }
  },

  // Get seasonal configuration
  async getSeasonalConfig(): Promise<SeasonalConfig | null> {
    try {
      const response = await adminApiClient.get<{ data?: SeasonalConfig } | SeasonalConfig>(`${BASE_URL}/config`);
      return unwrap(response) || null;
    } catch (error) {
      logger.error('Failed to fetch seasonal config:', error);
      return null;
    }
  },

  // Update seasonal configuration (banner, rotation frequency, featured product)
  async updateSeasonalConfig(config: Partial<SeasonalConfig>): Promise<Partial<SeasonalConfig>> {
    const response = await adminApiClient.patch<{ data?: SeasonalConfig } | SeasonalConfig>(`${BASE_URL}/config`, config);
    return unwrap(response) || config;
  },

  // Toggle product as seasonal
  async toggleSeasonalStatus(productId: number, seasonal: boolean): Promise<Product | undefined> {
    const response = await adminApiClient.patch<{ data?: Product } | Product>(`${BASE_URL}/products/${productId}/toggle`, {
      seasonal,
    });
    return unwrap(response);
  },

};

export default seasonalService;
