import SaveButton from "./SaveButton";

interface PaymentBillingSectionProps {
  paystackPub: string;
  setPaystackPub: (value: string) => void;
  paystackSec: string;
  setPaystackSec: (value: string) => void;
  webhookUrl: string;
  testMode: boolean;
  setTestMode: (value: boolean) => void;
  retryLogic: string;
  setRetryLogic: (value: string) => void;
  maxRetryAttempts: number;
  setMaxRetryAttempts: (value: number) => void;
  retryInterval: number;
  setRetryInterval: (value: number) => void;
  billingCycle: string;
  saving: boolean;
  settingsLoaded: boolean;
  onSave: () => void;
}

export default function PaymentBillingSection({
  paystackPub, setPaystackPub,
  paystackSec, setPaystackSec,
  webhookUrl,
  testMode, setTestMode,
  retryLogic, setRetryLogic,
  maxRetryAttempts, setMaxRetryAttempts,
  retryInterval, setRetryInterval,
  billingCycle,
  saving, settingsLoaded, onSave,
}: PaymentBillingSectionProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 flex flex-col gap-6">
      <h2 className="text-xl font-semibold mb-2">Payment & Billing Settings</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-1">Paystack Public Key</label>
          <input className="border rounded-lg px-4 py-2 w-full" value={paystackPub} onChange={e => setPaystackPub(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Paystack Secret Key</label>
          <input className="border rounded-lg px-4 py-2 w-full" value={paystackSec} onChange={e => setPaystackSec(e.target.value)} type="password" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Webhook URL</label>
          <input className="border rounded-lg px-4 py-2 w-full" value={webhookUrl} readOnly />
        </div>
        <div className="flex items-center gap-3 mt-2">
          <input type="checkbox" checked={testMode} onChange={e => setTestMode(e.target.checked)} />
          <span className="text-sm">Test Mode</span>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Retry Logic</label>
          <select className="border rounded-lg px-4 py-2 w-full" value={retryLogic} onChange={e => setRetryLogic(e.target.value)}>
            <option>Exponential</option>
            <option>Linear</option>
            <option>None</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Max Retry Attempts</label>
          <input type="number" className="border rounded-lg px-4 py-2 w-full" value={maxRetryAttempts} onChange={e => setMaxRetryAttempts(Number(e.target.value))} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Retry Interval (min)</label>
          <input type="number" className="border rounded-lg px-4 py-2 w-full" value={retryInterval} onChange={e => setRetryInterval(Number(e.target.value))} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Billing Cycle</label>
          <input className="border rounded-lg px-4 py-2 w-full" value={billingCycle} readOnly />
        </div>
      </div>
      <SaveButton saving={saving} settingsLoaded={settingsLoaded} onSave={onSave} />
    </div>
  );
}
