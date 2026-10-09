import SaveButton from "./SaveButton";

interface OperatingPreferencesSectionProps {
  autoAssignOrders: boolean;
  setAutoAssignOrders: (value: boolean) => void;
  autoActivateRiders: boolean;
  setAutoActivateRiders: (value: boolean) => void;
  enableSubscriptionBilling: boolean;
  setEnableSubscriptionBilling: (value: boolean) => void;
  defaultServiceFee: number;
  setDefaultServiceFee: (value: number) => void;
  timezone: string;
  setTimezone: (value: string) => void;
  dateFormat: string;
  setDateFormat: (value: string) => void;
  isServiceClosed: boolean;
  setIsServiceClosed: (updater: (prev: boolean) => boolean) => void;
  serviceClosedMessage: string;
  setServiceClosedMessage: (value: string) => void;
  saving: boolean;
  settingsLoaded: boolean;
  onSave: () => void;
}

export default function OperatingPreferencesSection({
  autoAssignOrders, setAutoAssignOrders,
  autoActivateRiders, setAutoActivateRiders,
  enableSubscriptionBilling, setEnableSubscriptionBilling,
  defaultServiceFee, setDefaultServiceFee,
  timezone, setTimezone,
  dateFormat, setDateFormat,
  isServiceClosed, setIsServiceClosed,
  serviceClosedMessage, setServiceClosedMessage,
  saving, settingsLoaded, onSave,
}: OperatingPreferencesSectionProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 flex flex-col gap-6">
      <h2 className="text-xl font-semibold mb-2">Operating Preferences</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex items-center gap-3">
          <input type="checkbox" checked={autoAssignOrders} onChange={e => setAutoAssignOrders(e.target.checked)} />
          <span className="text-sm">Order Auto-Assignment</span>
        </div>
        <div className="flex items-center gap-3">
          <input type="checkbox" checked={autoActivateRiders} onChange={e => setAutoActivateRiders(e.target.checked)} />
          <span className="text-sm">Auto-activate new riders</span>
        </div>
        <div className="flex items-center gap-3">
          <input type="checkbox" checked={enableSubscriptionBilling} onChange={e => setEnableSubscriptionBilling(e.target.checked)} />
          <span className="text-sm">Enable Subscription Billing</span>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Default Service Fee (GHS)</label>
          <input type="number" min="0" step="0.5" className="border rounded-lg px-4 py-2 w-full" value={defaultServiceFee} onChange={e => setDefaultServiceFee(Number(e.target.value))} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Timezone</label>
          <select className="border rounded-lg px-4 py-2 w-full" value={timezone} onChange={e => setTimezone(e.target.value)}>
            <option value="Africa/Accra">Africa/Accra</option>
            <option value="Africa/Lagos">Africa/Lagos</option>
            <option value="Africa/Nairobi">Africa/Nairobi</option>
            <option value="Africa/Johannesburg">Africa/Johannesburg</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Date Format</label>
          <select className="border rounded-lg px-4 py-2 w-full" value={dateFormat} onChange={e => setDateFormat(e.target.value)}>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>
        <div className="md:col-span-2 border border-red-200 rounded-lg p-4 bg-red-50 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold text-red-700">Close Service</span>
              <p className="text-xs text-red-500 mt-0.5">When on, the app will show a closed message to all signed-in users.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsServiceClosed(v => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isServiceClosed ? 'bg-red-600' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${isServiceClosed ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          {isServiceClosed && (
            <div>
              <label className="block text-xs font-medium text-red-700 mb-1">Message shown to users</label>
              <input
                className="border border-red-300 rounded-lg px-3 py-2 w-full text-sm bg-white"
                value={serviceClosedMessage}
                onChange={e => setServiceClosedMessage(e.target.value)}
                placeholder="We're closed for the night. See you tomorrow!"
              />
            </div>
          )}
        </div>
      </div>
      <SaveButton saving={saving} settingsLoaded={settingsLoaded} onSave={onSave} />
    </div>
  );
}
