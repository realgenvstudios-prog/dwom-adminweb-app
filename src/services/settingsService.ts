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

  updatedAt: Date;
}

export const settingsService = {
  /**
   * Get all settings
   */
  async getSettings(): Promise<Settings> {
    try {
      console.log('📊 [SettingsService] Fetching settings from backend');
      const settings = await adminApiClient.get<Settings>('/settings');
      console.log('✅ [SettingsService] Settings fetched successfully');
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
      console.log('📝 [SettingsService] Updating settings:', { keys: Object.keys(updatedSettings) });
      const response = await adminApiClient.patch<Settings>('/settings', updatedSettings);
      console.log('✅ [SettingsService] Settings updated successfully');
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
      console.log(`📊 [SettingsService] Fetching setting: ${key}`);
      const value = await adminApiClient.get(`/settings/${key}`);
      console.log(`✅ [SettingsService] Setting ${key} fetched successfully`);
      return value;
    } catch (error: any) {
      console.error(`❌ [SettingsService] Failed to fetch setting ${key}:`, error);
      throw error;
    }
  },
};

export default settingsService;
