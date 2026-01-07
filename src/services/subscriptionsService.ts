import adminApiClient from './apiClient';

export interface SubscriptionMetrics {
  totalActive: number;
  totalPaused: number;
  totalCancelled: number;
  totalFailed: number;
  mrr: number;
  churnRate: number;
  failedRenewalsCount: number;
}

export interface Subscription {
  id: number;
  userId: number;
  status: string;
  frequency: 'Weekly' | 'Biweekly' | 'Monthly';
  nextBillingDate: string;
  lastChargeDate?: string;
  lastChargeAmount: number;
  totalSpent: number;
  createdAt: string;
  updatedAt: string;
  User?: {
    id: number;
    name: string;
    email: string;
    phoneNumber: string;
  };
  SubscriptionItem?: Array<{
    id: number;
    productId: number;
    quantity: number;
    unitPrice: number;
    Product?: {
      nameEnglish: string;
      pricePerUnit: number;
    };
  }>;
}

export interface SubscriptionTrend {
  date: string;
  active: number;
  paused: number;
  cancelled: number;
  failed: number;
}

class SubscriptionsService {
  /**
   * Get subscription metrics for admin dashboard
   */
  async getMetrics(): Promise<SubscriptionMetrics> {
    try {
      console.log('📊 [SubscriptionsService] Fetching subscription metrics...');
      const metrics = (await adminApiClient.get('/subscriptions/admin/dashboard/metrics')) as any;
      console.log('✅ [SubscriptionsService] Metrics loaded:', metrics);
      return metrics;
    } catch (error: any) {
      console.error('❌ [SubscriptionsService] Failed to fetch metrics:', error.message);
      throw error;
    }
  }

  /**
   * Get all active subscriptions
   */
  async getActiveSubscriptions(): Promise<Subscription[]> {
    try {
      console.log('✅ [SubscriptionsService] Fetching active subscriptions...');
      const subscriptions = (await adminApiClient.get('/subscriptions/admin/dashboard/active')) as any;
      console.log('✅ [SubscriptionsService] Active subscriptions loaded:', subscriptions);
      return subscriptions || [];
    } catch (error: any) {
      console.error('❌ [SubscriptionsService] Failed to fetch active subscriptions:', error.message);
      return [];
    }
  }

  /**
   * Get all subscriptions
   */
  async getAllSubscriptions(): Promise<Subscription[]> {
    try {
      console.log('📋 [SubscriptionsService] Fetching all subscriptions...');
      const subscriptions = (await adminApiClient.get('/subscriptions/admin/dashboard/active')) as any;
      console.log('✅ [SubscriptionsService] All subscriptions loaded:', subscriptions);
      return subscriptions || [];
    } catch (error: any) {
      console.error('❌ [SubscriptionsService] Failed to fetch subscriptions:', error.message);
      return [];
    }
  }

  /**
   * Get subscriptions due for billing today
   */
  async getSubscriptionsDueToday(): Promise<Subscription[]> {
    try {
      console.log('🔔 [SubscriptionsService] Fetching subscriptions due today...');
      const subscriptions = (await adminApiClient.get('/subscriptions/admin/dashboard/due-today')) as any;
      console.log('✅ [SubscriptionsService] Due subscriptions:', subscriptions);
      return subscriptions || [];
    } catch (error: any) {
      console.error('❌ [SubscriptionsService] Failed to fetch due subscriptions:', error.message);
      return [];
    }
  }

  /**
   * Get subscription by ID
   */
  async getSubscriptionById(id: number): Promise<Subscription | null> {
    try {
      console.log(`📄 [SubscriptionsService] Fetching subscription ${id}...`);
      const subscription = (await adminApiClient.get(`/subscriptions/${id}`)) as any;
      console.log('✅ [SubscriptionsService] Subscription loaded:', subscription);
      return subscription;
    } catch (error: any) {
      console.error('❌ [SubscriptionsService] Failed to fetch subscription:', error.message);
      return null;
    }
  }

  /**
   * Update subscription status
   */
  async updateSubscriptionStatus(id: number, status: string): Promise<Subscription | null> {
    try {
      console.log(`🔄 [SubscriptionsService] Updating subscription ${id} status to ${status}...`);
      const subscription = (await adminApiClient.patch(`/subscriptions/${id}/status`, { status })) as any;
      console.log('✅ [SubscriptionsService] Subscription updated:', subscription);
      return subscription;
    } catch (error: any) {
      console.error('❌ [SubscriptionsService] Failed to update subscription:', error.message);
      throw error;
    }
  }

  /**
   * Get subscriptions with applied filters
   */
  async getFilteredSubscriptions(
    status?: string,
    frequency?: string,
    search?: string,
  ): Promise<Subscription[]> {
    try {
      const allSubs = await this.getAllSubscriptions();

      return allSubs.filter((sub) => {
        const statusMatch =
          !status || status === 'All' || (sub.status || '').toLowerCase() === status.toLowerCase();
        const frequencyMatch =
          !frequency || frequency === 'All' || sub.frequency === frequency;
        
        // Search by customer name or product names
        const productNames = (sub.SubscriptionItem || [])
          .map(item => item.Product?.nameEnglish || '')
          .join(' ')
          .toLowerCase();
        
        const searchMatch =
          !search ||
          (sub.User?.name || '').toLowerCase().includes(search.toLowerCase()) ||
          productNames.includes(search.toLowerCase());

        return statusMatch && frequencyMatch && searchMatch;
      });
    } catch (error: any) {
      console.error('❌ [SubscriptionsService] Failed to filter subscriptions:', error.message);
      return [];
    }
  }

  /**
   * Get summary stats
   */
  async getSummaryStats(): Promise<{
    active: number;
    paused: number;
    cancelled: number;
    failed: number;
    mrr: number;
    churnRate: number;
    failedRenewals: number;
  }> {
    try {
      const metrics = await this.getMetrics();
      const allSubs = await this.getAllSubscriptions();

      // Calculate MRR (assume monthly subscriptions at average price)
      const monthlyCount = allSubs.filter((s) => s.frequency === 'Monthly').length;
      const avgPrice = monthlyCount > 0 ? 250 : 0; // Average monthly subscription price
      const mrr = monthlyCount * avgPrice;

      return {
        active: metrics.totalActive,
        paused: metrics.totalPaused,
        cancelled: metrics.totalCancelled,
        failed: metrics.totalFailed,
        mrr,
        churnRate: metrics.churnRate,
        failedRenewals: metrics.failedRenewalsCount,
      };
    } catch (error: any) {
      console.error('❌ [SubscriptionsService] Failed to get summary stats:', error.message);
      return {
        active: 0,
        paused: 0,
        cancelled: 0,
        failed: 0,
        mrr: 0,
        churnRate: 0,
        failedRenewals: 0,
      };
    }
  }
}

export default new SubscriptionsService();
