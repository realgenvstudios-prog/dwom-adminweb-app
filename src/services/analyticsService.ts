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

/** GET /analytics/orders — order patterns from real orders (Ghana time). */
export interface OrderInsights {
  from: string;
  to: string;
  totals: {
    orders: number;
    customerPlaced: number;
    subscriptionOrders: number;
    cancelled: number;
    cancellationRate: number;
    revenue: number;
    avgOrderValue: number;
    avgBasket: number;
    medianBasket: number;
    avgItems: number;
    ordersPerDay: number;
    customers: number;
    newCustomers: number;
    newOrders: number;
    returningOrders: number;
  };
  /** Sunday-first; customer-placed orders only. */
  byWeekday: { day: string; orders: number; revenue: number; avgBasket: number }[];
  byHour: { hour: number; orders: number }[];
  /** [weekday 0=Sun][hour 0-23] → orders */
  heatmap: number[][];
  basketBuckets: { label: string; orders: number }[];
  topProducts: { name: string; quantity: number; revenue: number; orders: number }[];
  paymentMethods: { method: string; orders: number; revenue: number }[];
}

/** GET /analytics/signups — guests becoming customers, and where sign-in stalls. */
export interface SignupInsights {
  from: string;
  to: string;
  /** Distinct app installs reaching each sign-up step. */
  signupFunnel: { step: string; label: string; sessions: number }[];
  login: { codeRequested: number; codeVerified: number };
  guests: {
    guestInstalls: number;
    becameCustomers: number;
    signedInToExisting: number;
    medianMinutesToSignUp: number | null;
    hadCartBeforeSignUp: number;
  };
  /** From the server's record of each phone number's attempt. */
  attempts: {
    total: number;
    signedIn: number;
    stuck: number;
    stuckSignup: number;
    stuckLogin: number;
    neededMoreThanOneCode: number;
    typedAWrongCode: number;
    askedForHelp: number;
  };
  reasons: { reason: string; count: number }[];
  networks: { network: string; attempts: number; stuck: number }[];
}

/** GET /analytics/signups/stuck — Support only: people who never got in. */
export interface StuckSignIn {
  id: number;
  phoneNumber: string;
  network: string;
  flow: 'signup' | 'login';
  reason: string;
  codesSent: number;
  wrongCodes: number;
  askedForHelp: boolean;
  firstTriedAt: string;
  lastTriedAt: string;
  contactedAt: string | null;
  contactedBy: string | null;
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

  async getOrderInsights(from: Date, to: Date): Promise<OrderInsights> {
    const params = new URLSearchParams({ from: from.toISOString(), to: to.toISOString() });
    return adminApiClient.get<OrderInsights>(`/analytics/orders?${params.toString()}`);
  }

  async getSignups(from: Date, to: Date): Promise<SignupInsights> {
    const params = new URLSearchParams({ from: from.toISOString(), to: to.toISOString() });
    return adminApiClient.get<SignupInsights>(`/analytics/signups?${params.toString()}`);
  }

  async getStuckSignIns(): Promise<StuckSignIn[]> {
    return adminApiClient.get<StuckSignIn[]>('/analytics/signups/stuck');
  }

  async markContacted(id: number): Promise<{ id: number; contactedAt: string }> {
    return adminApiClient.post(`/analytics/signups/stuck/${id}/contacted`, {});
  }

  async getInsights(from: Date, to: Date): Promise<AnalyticsInsights> {
    const params = new URLSearchParams({ from: from.toISOString(), to: to.toISOString() });
    return adminApiClient.get<AnalyticsInsights>(`/analytics/insights?${params.toString()}`);
  }
}

export default new AnalyticsService();
