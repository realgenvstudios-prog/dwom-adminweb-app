import SaveButton from "./SaveButton";
import AdminPushNotificationSettings from "./AdminPushNotificationSettings";

interface EmailNotificationSectionProps {
  smtpKey: string;
  setSmtpKey: (value: string) => void;
  sendGridKey: string;
  setSendGridKey: (value: string) => void;
  notifyOrderUpdates: boolean;
  setNotifyOrderUpdates: (value: boolean) => void;
  notifyFailedSubscriptions: boolean;
  setNotifyFailedSubscriptions: (value: boolean) => void;
  notifyLowInventory: boolean;
  setNotifyLowInventory: (value: boolean) => void;
  notifyNewRiders: boolean;
  setNotifyNewRiders: (value: boolean) => void;
  saving: boolean;
  settingsLoaded: boolean;
  onSave: () => void;
}

export default function EmailNotificationSection({
  smtpKey, setSmtpKey,
  sendGridKey, setSendGridKey,
  notifyOrderUpdates, setNotifyOrderUpdates,
  notifyFailedSubscriptions, setNotifyFailedSubscriptions,
  notifyLowInventory, setNotifyLowInventory,
  notifyNewRiders, setNotifyNewRiders,
  saving, settingsLoaded, onSave,
}: EmailNotificationSectionProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 flex flex-col gap-6">
      <h2 className="text-xl font-semibold mb-2">Email & Notification Settings</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-1">SMTP API Key</label>
          <input className="border rounded-lg px-4 py-2 w-full" value={smtpKey} onChange={e => setSmtpKey(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">SendGrid API Key</label>
          <input className="border rounded-lg px-4 py-2 w-full" value={sendGridKey} onChange={e => setSendGridKey(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2 mt-2">
          <span className="text-sm font-medium mb-1">Notification Types</span>
          <div className="flex items-center gap-3">
            <input type="checkbox" checked={notifyOrderUpdates} onChange={e => setNotifyOrderUpdates(e.target.checked)} />
            <span className="text-sm">Order updates</span>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" checked={notifyFailedSubscriptions} onChange={e => setNotifyFailedSubscriptions(e.target.checked)} />
            <span className="text-sm">Failed subscription payments</span>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" checked={notifyLowInventory} onChange={e => setNotifyLowInventory(e.target.checked)} />
            <span className="text-sm">Low inventory alerts</span>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" checked={notifyNewRiders} onChange={e => setNotifyNewRiders(e.target.checked)} />
            <span className="text-sm">New rider signup</span>
          </div>
          <button className="mt-2 px-4 py-2 rounded bg-blue-100 text-blue-700 text-sm font-medium" onClick={() => {}}>Template Management</button>
        </div>
      </div>
      <SaveButton saving={saving} settingsLoaded={settingsLoaded} onSave={onSave} />
      <AdminPushNotificationSettings />
    </div>
  );
}
