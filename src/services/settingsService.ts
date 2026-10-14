import adminApiClient, { ApiError } from './apiClient';
import { logger } from '../utils/logger';

export interface Settings {
  // Business Information
  businessName: string;
  supportEmail: string;
  supportPhone: string;
  warehouseAddress: string;
  logo: string | null;

  // Operating Preferences
  autoAssignOrders: boolean;
  autoActivateRiders: boolean;
  enableSubscriptionBilling: boolean;
  defaultDeliveryFee: number;
  defaultServiceFee: number;
  timezone: string;
  dateFormat: string;

  // Payment & Billing
  testMode: boolean;
  retryLogic: string;
  maxRetryAttempts: number;
  retryInterval: number;
  billingCycle: string;

  // Email & Notification
  notifyOrderUpdates: boolean;
  notifyFailedSubscriptions: boolean;
  notifyLowInventory: boolean;
  notifyNewRiders: boolean;

  // Service Availability
  isServiceClosed: boolean;
  serviceClosedMessage: string;

  // Finance & Revenue
  subscriptionPriceGHS: number;
  grossProfitMarginPercent: number;
  minimumOrderValue: number;
  maxSmallOrderFee: number;
  paystackFeePercent: number;
  packagingCostPerOrder: number;
  pickerRatePerOrder: number;
  pickerDailyMinimumPay: number;
  pickerDailyThreshold: number;

  updatedAt: Date;
}

export const settingsService = {
  /**
   * Get all settings
   */
  async getSettings(): Promise<Settings> {
    try {
      // Full settings are admin-only (GET /settings is the public subset the
      // app reads). Fall back to it while a backend without /settings/admin
      // is still deployed.
      try {
        return await adminApiClient.get<Settings>('/settings/admin');
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return await adminApiClient.get<Settings>('/settings');
        throw err;
      }
    } catch (error) {
      logger.error('❌ [SettingsService] Failed to fetch settings:', error);
      throw error;
    }
  },

  /**
   * Update settings
   */
  async updateSettings(updatedSettings: Partial<Settings>): Promise<Settings> {
    try {
      const response = await adminApiClient.patch<Settings>('/settings', updatedSettings);
      return response;
    } catch (error) {
      logger.error('❌ [SettingsService] Failed to update settings:', error);
      throw error;
    }
  },
};

export default settingsService;
