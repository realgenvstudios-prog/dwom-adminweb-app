import api from '../api/api';

const BASE_URL = '/seasonal';

interface SeasonalConfig {
  bannerImageUrl: string;
  rotationFrequency: 'daily' | 'weekly' | 'monthly';
  featuredProductId: number;
}

const seasonalService = {
  // Get all seasonal products
  async getSeasonalProducts() {
    const response = await api.get(`${BASE_URL}/products`);
    return response.data;
  },

  // Get featured seasonal product
  async getFeaturedSeasonalProduct() {
    const response = await api.get(`${BASE_URL}/featured`);
    return response.data;
  },

  // Get seasonal configuration
  async getSeasonalConfig() {
    const response = await api.get(`${BASE_URL}/config`);
    return response.data;
  },

  // Update seasonal configuration (banner, rotation frequency, featured product)
  async updateSeasonalConfig(config: Partial<SeasonalConfig>) {
    const response = await api.put(`${BASE_URL}/config`, config);
    return response.data;
  },

  // Toggle product as seasonal
  async toggleSeasonalStatus(productId: number, seasonal: boolean, seasonalDiscount: number = 0) {
    const response = await api.put(`${BASE_URL}/products/${productId}/toggle`, {
      seasonal,
      seasonalDiscount,
    });
    return response.data;
  },

  // Update seasonal discount for a product
  async updateSeasonalDiscount(productId: number, discount: number) {
    const response = await api.put(`${BASE_URL}/products/${productId}/discount`, {
      discount,
    });
    return response.data;
  },
};

export default seasonalService;
