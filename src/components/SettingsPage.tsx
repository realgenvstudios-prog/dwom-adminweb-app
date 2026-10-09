import React from "react";
import { useSettingsData } from "./settings/useSettingsData";
import BusinessInfoSection from "./settings/BusinessInfoSection";
import OperatingPreferencesSection from "./settings/OperatingPreferencesSection";
import UserRolesSection from "./settings/UserRolesSection";
import PaymentBillingSection from "./settings/PaymentBillingSection";
import EmailNotificationSection from "./settings/EmailNotificationSection";
import SecurityAuditSection from "./settings/SecurityAuditSection";

const SettingsPage: React.FC = () => {
  // Mock data — not backend-synced (see UserRolesSection)
  const roleTemplates = ["Owner", "Manager", "Finance", "Warehouse", "Support"];
  const adminUsers = [
    { name: "Ama Serwaa", email: "ama@dwom.com", role: "Owner", lastActive: "2025-12-11 09:12" },
    { name: "Yaw Mensah", email: "yaw@dwom.com", role: "Manager", lastActive: "2025-12-10 18:44" },
    { name: "Kojo Owusu", email: "kojo@dwom.com", role: "Finance", lastActive: "2025-12-09 15:20" },
    { name: "Akosua Dede", email: "akosua@dwom.com", role: "Warehouse", lastActive: "2025-12-08 11:05" },
  ];
  const permissionsMatrix = [
    { role: "Owner", permissions: ["All"] },
    { role: "Manager", permissions: ["Orders", "Products", "Riders", "Warehouse"] },
    { role: "Finance", permissions: ["Finance", "Billing"] },
    { role: "Warehouse", permissions: ["Inventory", "Warehouse"] },
    { role: "Support", permissions: ["Support", "Customers"] },
  ];

  const s = useSettingsData();

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4">
      {s.loading ? (
        <div className="flex items-center justify-center py-20">
          <svg
            className="animate-spin h-8 w-8 text-blue-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="ml-3 text-gray-600">Loading settings...</p>
        </div>
      ) : (
        <div className="max-w-screen-2xl mx-auto flex flex-col gap-10">
          {/* Error Message */}
          {s.error && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
              {s.error}
            </div>
          )}

          {/* Success Message */}
          {s.success && (
            <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-700">
              ✅ Settings saved successfully!
            </div>
          )}

          <BusinessInfoSection
            businessName={s.businessName} setBusinessName={s.setBusinessName}
            supportEmail={s.supportEmail} setSupportEmail={s.setSupportEmail}
            supportPhone={s.supportPhone} setSupportPhone={s.setSupportPhone}
            warehouseAddress={s.warehouseAddress} setWarehouseAddress={s.setWarehouseAddress}
            logo={s.logo} handleLogoUpload={s.handleLogoUpload}
            saving={s.saving} settingsLoaded={s.settingsLoaded} onSave={s.handleSave}
          />

          <OperatingPreferencesSection
            autoAssignOrders={s.autoAssignOrders} setAutoAssignOrders={s.setAutoAssignOrders}
            autoActivateRiders={s.autoActivateRiders} setAutoActivateRiders={s.setAutoActivateRiders}
            enableSubscriptionBilling={s.enableSubscriptionBilling} setEnableSubscriptionBilling={s.setEnableSubscriptionBilling}
            defaultServiceFee={s.defaultServiceFee} setDefaultServiceFee={s.setDefaultServiceFee}
            timezone={s.timezone} setTimezone={s.setTimezone}
            dateFormat={s.dateFormat} setDateFormat={s.setDateFormat}
            isServiceClosed={s.isServiceClosed} setIsServiceClosed={s.setIsServiceClosed}
            serviceClosedMessage={s.serviceClosedMessage} setServiceClosedMessage={s.setServiceClosedMessage}
            saving={s.saving} settingsLoaded={s.settingsLoaded} onSave={s.handleSave}
          />

          <UserRolesSection
            adminUsers={adminUsers}
            roleTemplates={roleTemplates}
            permissionsMatrix={permissionsMatrix}
            saving={s.saving} settingsLoaded={s.settingsLoaded} onSave={s.handleSave}
          />

          <PaymentBillingSection
            paystackPub={s.paystackPub} setPaystackPub={s.setPaystackPub}
            paystackSec={s.paystackSec} setPaystackSec={s.setPaystackSec}
            webhookUrl={s.webhookUrl}
            testMode={s.testMode} setTestMode={s.setTestMode}
            retryLogic={s.retryLogic} setRetryLogic={s.setRetryLogic}
            maxRetryAttempts={s.maxRetryAttempts} setMaxRetryAttempts={s.setMaxRetryAttempts}
            retryInterval={s.retryInterval} setRetryInterval={s.setRetryInterval}
            billingCycle={s.billingCycle}
            saving={s.saving} settingsLoaded={s.settingsLoaded} onSave={s.handleSave}
          />

          <EmailNotificationSection
            smtpKey={s.smtpKey} setSmtpKey={s.setSmtpKey}
            sendGridKey={s.sendGridKey} setSendGridKey={s.setSendGridKey}
            notifyOrderUpdates={s.notifyOrderUpdates} setNotifyOrderUpdates={s.setNotifyOrderUpdates}
            notifyFailedSubscriptions={s.notifyFailedSubscriptions} setNotifyFailedSubscriptions={s.setNotifyFailedSubscriptions}
            notifyLowInventory={s.notifyLowInventory} setNotifyLowInventory={s.setNotifyLowInventory}
            notifyNewRiders={s.notifyNewRiders} setNotifyNewRiders={s.setNotifyNewRiders}
            saving={s.saving} settingsLoaded={s.settingsLoaded} onSave={s.handleSave}
          />

          <SecurityAuditSection
            password={s.password} setPassword={s.setPassword}
            enable2FA={s.enable2FA} setEnable2FA={s.setEnable2FA}
            ipAccessControlList={s.ipAccessControlList}
            saving={s.saving} settingsLoaded={s.settingsLoaded} onSave={s.handleSave}
          />
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
