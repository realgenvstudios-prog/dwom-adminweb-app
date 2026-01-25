import adminApiClient from './apiClient';

const BASE_URL = '/seasonal';

interface SeasonalConfig {
  bannerImageUrls?: string[];
  rotationFrequency: 'daily' | 'weekly' | 'monthly';
  featuredProductId: number;
}

const seasonalService = {
  // Get all seasonal products
  async getSeasonalProducts() {
    try {
      const response: any = await adminApiClient.get(`${BASE_URL}/products`);
      return response?.data || response || [];
    } catch (error) {
      console.error('Failed to fetch seasonal products:', error);
      return [];
    }
  },

  // Get featured seasonal product
  async getFeaturedSeasonalProduct() {
    try {
      const response: any = await adminApiClient.get(`${BASE_URL}/featured`);
      return response?.data || response || null;
    } catch (error) {
      console.error('Failed to fetch featured product:', error);
      return null;
    }
  },

  // Get seasonal configuration
  async getSeasonalConfig() {
    try {
      const response: any = await adminApiClient.get(`${BASE_URL}/config`);
      return response?.data || response || null;
    } catch (error) {
      console.error('Failed to fetch seasonal config:', error);
      return null;
    }
  },

  // Update seasonal configuration (banner, rotation frequency, featured product)
  async updateSeasonalConfig(config: Partial<SeasonalConfig>) {
    const response: any = await adminApiClient.patch(`${BASE_URL}/config`, config);
    return response?.data || response || config;
  },

  // Toggle product as seasonal
  async toggleSeasonalStatus(productId: number, seasonal: boolean, seasonalDiscount: number = 0) {
    const response: any = await adminApiClient.patch(`${BASE_URL}/products/${productId}/toggle`, {
      seasonal,
      seasonalDiscount,
    });
    return response?.data || response;
  },

  // Update seasonal discount for a product
  async updateSeasonalDiscount(productId: number, discount: number) {
    const response: any = await adminApiClient.patch(`${BASE_URL}/products/${productId}/discount`, {
      discount,
    });
    return response?.data || response;
  },
};

export default seasonalService;
