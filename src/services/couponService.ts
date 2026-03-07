import adminApiClient from './apiClient';

export interface Coupon {
  id: number;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxUses: number | null;
  usageCount: number;
  usagePerUser: number;
  expiresAt: string | null;
  active: boolean;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCouponPayload {
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount?: number;
  maxUses?: number | null;
  usagePerUser?: number;
  expiresAt?: string | null;
}

export interface CouponStats {
  couponId: number;
  code: string;
  totalUsages: number;
  uniqueUsers: number;
  totalDiscount: number;
}

class CouponService {
  async getAll(includeInactive = true): Promise<Coupon[]> {
    try {
      const query = includeInactive ? '?includeInactive=true' : '';
      const data = (await adminApiClient.get(`/coupons${query}`)) as any;
      return Array.isArray(data) ? data : [];
    } catch (error: any) {
      console.error('❌ [CouponService] getAll failed:', error.message);
      throw error;
    }
  }

  async create(payload: CreateCouponPayload): Promise<Coupon> {
    try {
      const data = (await adminApiClient.post('/coupons', payload)) as any;
      return data;
    } catch (error: any) {
      console.error('❌ [CouponService] create failed:', error.message);
      throw error;
    }
  }

  async update(id: number, payload: Partial<CreateCouponPayload>): Promise<Coupon> {
    try {
      const data = (await adminApiClient.patch(`/coupons/${id}`, payload)) as any;
      return data;
    } catch (error: any) {
      console.error('❌ [CouponService] update failed:', error.message);
      throw error;
    }
  }

  async toggleStatus(id: number, active: boolean): Promise<Coupon> {
    try {
      const data = (await adminApiClient.patch(`/coupons/${id}/toggle-status`, { active })) as any;
      return data;
    } catch (error: any) {
      console.error('❌ [CouponService] toggleStatus failed:', error.message);
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await adminApiClient.delete(`/coupons/${id}`);
    } catch (error: any) {
      console.error('❌ [CouponService] delete failed:', error.message);
      throw error;
    }
  }

  async getStats(id: number): Promise<CouponStats> {
    try {
      const data = (await adminApiClient.get(`/coupons/${id}/stats`)) as any;
      return data;
    } catch (error: any) {
      console.error('❌ [CouponService] getStats failed:', error.message);
      throw error;
    }
  }
}

const couponService = new CouponService();
export default couponService;
