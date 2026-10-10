import adminApiClient from './apiClient';
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

  // Security
  enable2FA: boolean;
  ipAccessControlList: string[];

  // Service Availability
  isServiceClosed: boolean;
  serviceClosedMessage: string;

  updatedAt: Date;
}

export const settingsService = {
  /**
   * Get all settings
   */
  async getSettings(): Promise<Settings> {
    try {
      const settings = await adminApiClient.get<Settings>('/settings');
      return settings;
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

  /**
   * Get a specific setting — currently unused by any screen.
   */
  async getSetting(key: string): Promise<unknown> {
    try {
      const value = await adminApiClient.get(`/settings/${key}`);
      return value;
    } catch (error) {
      logger.error(`❌ [SettingsService] Failed to fetch setting ${key}:`, error);
      throw error;
    }
  },
};

export default settingsService;
