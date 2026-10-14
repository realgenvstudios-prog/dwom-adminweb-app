import adminApiClient from './apiClient';
import { logger } from '../utils/logger';

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
  campaignId?: number | null;
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
  campaignId?: number | null;
}

// Matches GET /coupons/:id/stats (discount amounts are Decimals — parse them).
export interface CouponStats {
  coupon: Coupon;
  totalUsages: number;
  uniqueUsers: number;
  totalDiscountGiven: number | string;
  usages: { id: number; userId: number; orderId: number | null; discount: number | string; createdAt: string }[];
}

class CouponService {
  async getAll(includeInactive = true): Promise<Coupon[]> {
    try {
      const query = includeInactive ? '?includeInactive=true' : '';
      const data = await adminApiClient.get<Coupon[]>(`/coupons${query}`);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      logger.error('❌ [CouponService] getAll failed:', (error as Error).message);
      throw error;
    }
  }

  async create(payload: CreateCouponPayload): Promise<Coupon> {
    try {
      const data = await adminApiClient.post<Coupon>('/coupons', payload);
      return data;
    } catch (error) {
      logger.error('❌ [CouponService] create failed:', (error as Error).message);
      throw error;
    }
  }

  async update(id: number, payload: Partial<CreateCouponPayload>): Promise<Coupon> {
    try {
      const data = await adminApiClient.patch<Coupon>(`/coupons/${id}`, payload);
      return data;
    } catch (error) {
      logger.error('❌ [CouponService] update failed:', (error as Error).message);
      throw error;
    }
  }

  async toggleStatus(id: number, active: boolean): Promise<Coupon> {
    try {
      const data = await adminApiClient.patch<Coupon>(`/coupons/${id}/toggle-status`, { active });
      return data;
    } catch (error) {
      logger.error('❌ [CouponService] toggleStatus failed:', (error as Error).message);
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await adminApiClient.delete(`/coupons/${id}`);
    } catch (error) {
      logger.error('❌ [CouponService] delete failed:', (error as Error).message);
      throw error;
    }
  }

  async getStats(id: number): Promise<CouponStats> {
    try {
      const data = await adminApiClient.get<CouponStats>(`/coupons/${id}/stats`);
      return data;
    } catch (error) {
      logger.error('❌ [CouponService] getStats failed:', (error as Error).message);
      throw error;
    }
  }
}

const couponService = new CouponService();
export default couponService;
