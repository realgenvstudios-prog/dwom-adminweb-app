import { useEffect, useState, type ChangeEvent } from "react";
import settingsService, { type Settings } from "../../services/settingsService";

// All backend-synced settings fields, their load/save, and the logo
// upload handler. Split out of the former monolithic SettingsPage. The
// mock-data sections (admin users, role templates, permissions matrix)
// stay in the main component since they're not backend-synced.
export function useSettingsData() {
  // Business Info
  const [businessName, setBusinessName] = useState("DWOM Ghana Ltd.");
  const [supportEmail, setSupportEmail] = useState("support@dwom.com");
  const [supportPhone, setSupportPhone] = useState("0244000000");
  const [warehouseAddress, setWarehouseAddress] = useState("Accra Central, Ghana");
  const [logo, setLogo] = useState("");

  // Operating Preferences
  const [autoAssignOrders, setAutoAssignOrders] = useState(true);
  const [autoActivateRiders, setAutoActivateRiders] = useState(false);
  const [enableSubscriptionBilling, setEnableSubscriptionBilling] = useState(true);
  const [defaultServiceFee, setDefaultServiceFee] = useState(2);
  const [timezone, setTimezone] = useState("Africa/Accra");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");
  const [isServiceClosed, setIsServiceClosed] = useState(false);
  const [serviceClosedMessage, setServiceClosedMessage] = useState("We're closed for the night. See you tomorrow!");

  // Payment & Billing
  const [paystackPub, setPaystackPub] = useState("pk_live_************abcd");
  const [paystackSec, setPaystackSec] = useState("sk_live_************wxyz");
  const [webhookUrl] = useState("https://dwom.com/api/paystack/webhook");
  const [testMode, setTestMode] = useState(false);
  const [retryLogic, setRetryLogic] = useState("Exponential");
  const [maxRetryAttempts, setMaxRetryAttempts] = useState(3);
  const [retryInterval, setRetryInterval] = useState(10);
  const [billingCycle] = useState("Monthly");

  // Email & Notification
  const [smtpKey, setSmtpKey] = useState("");
  const [sendGridKey, setSendGridKey] = useState("");
  const [notifyOrderUpdates, setNotifyOrderUpdates] = useState(true);
  const [notifyFailedSubscriptions, setNotifyFailedSubscriptions] = useState(true);
  const [notifyLowInventory, setNotifyLowInventory] = useState(false);
  const [notifyNewRiders, setNotifyNewRiders] = useState(true);

  // Security & Audit
  const [password, setPassword] = useState("");
  const [enable2FA, setEnable2FA] = useState(false);
  const [ipAccessControlList, setIpAccessControlList] = useState<string[]>(["102.176.0.1", "41.215.12.34"]);

  // UI State
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Logo upload handler
  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => setLogo(ev.target?.result as string);
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // Load settings from backend
  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const s = await settingsService.getSettings();
      setBusinessName(s.businessName ?? "DWOM Ghana Ltd.");
      setSupportEmail(s.supportEmail ?? "support@dwom.com");
      setSupportPhone(s.supportPhone ?? "0244000000");
      setWarehouseAddress(s.warehouseAddress ?? "Accra Central, Ghana");
      setLogo(s.logo ?? "");
      setAutoAssignOrders(!!s.autoAssignOrders);
      setAutoActivateRiders(!!s.autoActivateRiders);
      setEnableSubscriptionBilling(!!s.enableSubscriptionBilling);
      setDefaultServiceFee(s.defaultServiceFee ?? 2);
      setTimezone(s.timezone ?? "Africa/Accra");
      setDateFormat(s.dateFormat ?? "DD/MM/YYYY");
      setIsServiceClosed(!!s.isServiceClosed);
      setServiceClosedMessage(s.serviceClosedMessage ?? "We're closed for the night. See you tomorrow!");
      setTestMode(!!s.testMode);
      setRetryLogic(s.retryLogic ?? "Exponential");
      setMaxRetryAttempts(s.maxRetryAttempts ?? 3);
      setRetryInterval(s.retryInterval ?? 10);
      setNotifyOrderUpdates(!!s.notifyOrderUpdates);
      setNotifyFailedSubscriptions(!!s.notifyFailedSubscriptions);
      setNotifyLowInventory(!!s.notifyLowInventory);
      setNotifyNewRiders(!!s.notifyNewRiders);
      setEnable2FA(!!s.enable2FA);
      setIpAccessControlList(s.ipAccessControlList ?? []);
      setSettingsLoaded(true);
    } catch (err: any) {
      console.error('❌ Error loading settings:', err);
      setError(err.message || 'Failed to load settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // Save handler
  const handleSave = async () => {
    if (!settingsLoaded) {
      setError('Settings failed to load. Please refresh the page before saving.');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      console.log('💾 Saving settings...');

      const updatedSettings: Partial<Settings> = {
        businessName,
        supportEmail,
        supportPhone,
        warehouseAddress,
        logo,
        autoAssignOrders,
        autoActivateRiders,
        enableSubscriptionBilling,
        defaultServiceFee,
        timezone,
        dateFormat,
        isServiceClosed,
        serviceClosedMessage,
        testMode,
        retryLogic,
        maxRetryAttempts,
        retryInterval,
        notifyOrderUpdates,
        notifyFailedSubscriptions,
        notifyLowInventory,
        notifyNewRiders,
        enable2FA,
        ipAccessControlList,
      };

      await settingsService.updateSettings(updatedSettings);
      console.log('✅ Settings saved successfully:', updatedSettings);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('❌ Error saving settings:', err);
      setError(err.message || 'Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return {
    businessName, setBusinessName,
    supportEmail, setSupportEmail,
    supportPhone, setSupportPhone,
    warehouseAddress, setWarehouseAddress,
    logo, handleLogoUpload,
    autoAssignOrders, setAutoAssignOrders,
    autoActivateRiders, setAutoActivateRiders,
    enableSubscriptionBilling, setEnableSubscriptionBilling,
    defaultServiceFee, setDefaultServiceFee,
    timezone, setTimezone,
    dateFormat, setDateFormat,
    isServiceClosed, setIsServiceClosed,
    serviceClosedMessage, setServiceClosedMessage,
    paystackPub, setPaystackPub,
    paystackSec, setPaystackSec,
    webhookUrl,
    testMode, setTestMode,
    retryLogic, setRetryLogic,
    maxRetryAttempts, setMaxRetryAttempts,
    retryInterval, setRetryInterval,
    billingCycle,
    smtpKey, setSmtpKey,
    sendGridKey, setSendGridKey,
    notifyOrderUpdates, setNotifyOrderUpdates,
    notifyFailedSubscriptions, setNotifyFailedSubscriptions,
    notifyLowInventory, setNotifyLowInventory,
    notifyNewRiders, setNotifyNewRiders,
    password, setPassword,
    enable2FA, setEnable2FA,
    ipAccessControlList,
    loading,
    saving,
    settingsLoaded,
    error,
    success,
    handleSave,
  };
}
