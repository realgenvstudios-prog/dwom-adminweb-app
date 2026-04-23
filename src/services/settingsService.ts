import adminApiClient from './apiClient';

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
    } catch (error: any) {
      console.error('❌ [SettingsService] Failed to fetch settings:', error);
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
    } catch (error: any) {
      console.error('❌ [SettingsService] Failed to update settings:', error);
      throw error;
    }
  },

  /**
   * Get a specific setting
   */
  async getSetting(key: string): Promise<any> {
    try {
      const value = await adminApiClient.get(`/settings/${key}`);
      return value;
    } catch (error: any) {
      console.error(`❌ [SettingsService] Failed to fetch setting ${key}:`, error);
      throw error;
    }
  },
};

export default settingsService;
