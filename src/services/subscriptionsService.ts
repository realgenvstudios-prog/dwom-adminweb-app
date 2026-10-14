import adminApiClient from './apiClient';
import { logger } from '../utils/logger';

// Stored values (lower-case). A subscription stays 'active' while its
// payments fail — failures live on its billing attempts.
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled';
export type SubscriptionFrequency = 'weekly' | 'biweekly' | 'monthly';

/** SubscriptionBilling.status values written by the billing scheduler. */
export type BillingStatus = 'pending' | 'charged' | 'failed' | 'pending_retry' | string;

export interface SubscriptionBilling {
  id: number;
  billingDate: string;
  amount: number | string;
  status: BillingStatus;
  paymentRef?: string | null;
  failureReason?: string | null;
  retryCount: number;
  maxRetries: number;
  nextRetryDate?: string | null;
}

export interface SubscriptionItem {
  id: number;
  productId: number;
  quantity: number;
  unitPrice: number | string;
  /** Chosen options snapshot, e.g. [{ label: "15 half crate" }] */
  selectedVariations?: Array<{ label?: string }> | null;
  Product?: { id?: number; nameEnglish: string; pricePerUnit?: number | string; imageUrl?: string | null; active?: boolean } | null;
}

export interface Subscription {
  id: number;
  userId: number;
  name?: string | null;
  status: SubscriptionStatus | string;
  frequency: SubscriptionFrequency | string;
  dayOfWeek?: number | null;
  dayOfMonth?: number | null;
  nextBillingDate: string;
  autoCharge?: boolean;
  paymentMethod?: string | null;
  lastChargeDate?: string | null;
  lastChargeAmount?: number | string | null;
  totalCharges?: number;
  totalSpent: number | string;
  createdAt: string;
  updatedAt: string;
  User?: { id: number; name: string | null; email?: string | null; phoneNumber: string | null } | null;
  SubscriptionItem?: SubscriptionItem[];
  /** Admin list: latest attempt only. Admin detail: last 20. */
  SubscriptionBilling?: SubscriptionBilling[];
  Address?: { label: string; addressText: string; recipientName?: string | null } | null;
}

class SubscriptionsService {
  async getAllSubscriptions(): Promise<Subscription[]> {
    try {
      const subscriptions = await adminApiClient.get<Subscription[]>('/subscriptions/admin/dashboard/all');
      return Array.isArray(subscriptions) ? subscriptions : [];
    } catch (error) {
      logger.error('❌ [SubscriptionsService] Failed to fetch subscriptions:', (error as Error).message);
      throw error;
    }
  }

  async getSubscription(id: number): Promise<Subscription> {
    return adminApiClient.get<Subscription>(`/subscriptions/admin/dashboard/${id}`);
  }

  async setStatus(id: number, status: SubscriptionStatus): Promise<Subscription> {
    try {
      return await adminApiClient.patch<Subscription>(`/subscriptions/admin/dashboard/${id}/status`, { status });
    } catch (error) {
      logger.error('❌ [SubscriptionsService] Failed to update subscription:', (error as Error).message);
      throw error;
    }
  }
}

export default new SubscriptionsService();
