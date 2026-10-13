import React, { useState, useEffect, useCallback } from "react";
import { settingsService, type Settings } from "../../services/settingsService";
import { logger } from "../../utils/logger";

type FinanceSettingsKey =
  | "minimumOrderValue"
  | "maxSmallOrderFee"
  | "paystackFeePercent"
  | "packagingCostPerOrder"
  | "subscriptionPriceGHS"
  | "grossProfitMarginPercent"
  | "pickerRatePerOrder"
  | "pickerDailyMinimumPay"
  | "pickerDailyThreshold";

const FIELDS: { key: FinanceSettingsKey; label: string; hint: string; step?: string }[] = [
  { key: "minimumOrderValue", label: "Minimum order value (GHS)", hint: "Basket value at/above which no small-order fee applies." },
  { key: "maxSmallOrderFee", label: "Max small-order fee (GHS)", hint: "Cap on the gap-fill fee for baskets below the minimum." },
  { key: "paystackFeePercent", label: "Paystack fee estimate (%)", hint: "Used to estimate card/momo processing cost per order." },
  { key: "packagingCostPerOrder", label: "Packaging cost per order (GHS)", hint: "Flat assumed packaging cost added to every order's cost." },
  { key: "subscriptionPriceGHS", label: "Subscription price (GHS/month)", hint: "Used for MRR calculation." },
  { key: "grossProfitMarginPercent", label: "Fallback gross margin (%)", hint: "Only used when no real cost data exists yet for a period." },
  { key: "pickerRatePerOrder", label: "Picker pay per order (GHS)", hint: "Paid once a worker hits the daily threshold." },
  { key: "pickerDailyMinimumPay", label: "Picker daily minimum (GHS)", hint: "Flat pay for a worker's day when under the threshold." },
  { key: "pickerDailyThreshold", label: "Picker daily threshold (orders)", hint: "Orders/day at or above which per-order pay applies instead of the flat minimum.", step: "1" },
];

const SettingsTab: React.FC = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await settingsService.getSettings();
      setSettings(data);
      const next: Record<string, string> = {};
      for (const f of FIELDS) next[f.key] = String(data[f.key] ?? "");
      setForm(next);
    } catch (err) {
      logger.error("Failed to load finance settings:", err);
      setError("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSaved(false);
      const payload: Partial<Settings> = {};
      for (const f of FIELDS) {
        const raw = form[f.key];
        if (raw !== undefined && raw !== "") {
          (payload as any)[f.key] = f.key === "pickerDailyThreshold" ? parseInt(raw, 10) : parseFloat(raw);
        }
      }
      const updated = await settingsService.updateSettings(payload);
      setSettings(updated);
      setSaved(true);
    } catch (err) {
      logger.error("Failed to save finance settings:", err);
      setError("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !settings) {
    return <p className="text-gray-500 text-sm py-8 text-center">Loading...</p>;
  }

  return (
    <>
      <p className="text-gray-600 mb-6">
        These numbers drive every cost/margin calculation across Overview, Product Costs, Expenses, and Workers & Trips.
      </p>

      <form onSubmit={handleSave} className="bg-white shadow-sm rounded-xl border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <input
                type="number"
                min="0"
                step={f.step ?? "0.01"}
                value={form[f.key] ?? ""}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2"
              />
              <p className="text-xs text-gray-400 mt-1">{f.hint}</p>
            </div>
          ))}
        </div>
        {error && <p className="text-red-600 text-sm mt-4">⚠️ {error}</p>}
        {saved && !error && <p className="text-green-700 text-sm mt-4">✅ Settings saved.</p>}
        <button
          type="submit"
          disabled={saving}
          className="mt-6 bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </form>
    </>
  );
};

export default SettingsTab;
