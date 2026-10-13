import React, { useState, useEffect, useCallback } from "react";
import founderLedgerService, { type FounderLedgerEntry, type FounderBalance } from "../services/founderLedgerService";
import { logger } from "../utils/logger";

const today = () => new Date().toISOString().split("T")[0];

const emptyForm = {
  date: today(),
  type: "contribution" as "contribution" | "reimbursement",
  founderName: "",
  amount: "",
  method: "",
  approvedBy: "",
  notes: "",
};

const FounderLedgerPage: React.FC = () => {
  const [entries, setEntries] = useState<FounderLedgerEntry[]>([]);
  const [balance, setBalance] = useState<FounderBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [entriesData, balanceData] = await Promise.all([
        founderLedgerService.getAll(),
        founderLedgerService.getBalance(),
      ]);
      setEntries(entriesData);
      setBalance(balanceData);
    } catch (err) {
      logger.error("Failed to load founder ledger:", err);
      setError("Failed to load founder ledger");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!form.founderName.trim() || !amount || amount <= 0) {
      setSaveError("Enter a founder name and a valid amount");
      return;
    }
    try {
      setSaving(true);
      setSaveError(null);
      await founderLedgerService.create({
        date: form.date,
        type: form.type,
        founderName: form.founderName,
        amount,
        method: form.method || undefined,
        approvedBy: form.approvedBy || undefined,
        notes: form.notes || undefined,
      });
      setForm(emptyForm);
      await load();
    } catch (err) {
      logger.error("Failed to save founder ledger entry:", err);
      setSaveError("Failed to save entry");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this entry?")) return;
    try {
      await founderLedgerService.remove(id);
      await load();
    } catch (err) {
      logger.error("Failed to delete entry:", err);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Founder Ledger</h1>
          <p className="text-gray-600 mt-1">
            Founder capital in and out — kept fully separate from business revenue, expenses, and P&L.
          </p>
        </div>

        {balance && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow p-6">
              <div className="text-sm text-gray-500 mb-1">Total Contributions</div>
              <div className="text-2xl font-bold text-green-700">GHS {balance.totalContributions.toLocaleString()}</div>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <div className="text-sm text-gray-500 mb-1">Total Reimbursements</div>
              <div className="text-2xl font-bold text-amber-700">GHS {balance.totalReimbursements.toLocaleString()}</div>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <div className="text-sm text-gray-500 mb-1">Outstanding Balance</div>
              <div className={`text-2xl font-bold ${balance.balance >= 0 ? "text-blue-700" : "text-red-700"}`}>
                GHS {balance.balance.toLocaleString()}
              </div>
              <div className="text-xs text-gray-400 mt-1">What the business still owes its founders</div>
            </div>
          </div>
        )}

        {balance && balance.byFounder.length > 0 && (
          <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">By founder</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {balance.byFounder.map((f) => (
                <div key={f.founderName} className="border border-gray-100 rounded-lg p-4">
                  <div className="font-semibold text-gray-900 mb-1">{f.founderName}</div>
                  <div className="text-sm text-gray-500">
                    Contributed GHS {f.contributions.toLocaleString()} · Reimbursed GHS {f.reimbursements.toLocaleString()}
                  </div>
                  <div className={`text-sm font-semibold mt-1 ${f.balance >= 0 ? "text-blue-700" : "text-red-700"}`}>
                    Balance: GHS {f.balance.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-xl border border-gray-100 p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Record an entry</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as "contribution" | "reimbursement" })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2"
              >
                <option value="contribution">Contribution (in)</option>
                <option value="reimbursement">Reimbursement (out)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Founder name</label>
              <input
                type="text"
                value={form.founderName}
                onChange={(e) => setForm({ ...form, founderName: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Amount (GHS)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Method</label>
              <input
                type="text"
                value={form.method}
                onChange={(e) => setForm({ ...form, method: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2"
                placeholder="cash, bank transfer..."
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Approved by</label>
              <input
                type="text"
                value={form.approvedBy}
                onChange={(e) => setForm({ ...form, approvedBy: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 mb-1">Notes</label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2"
              />
            </div>
          </div>
          {saveError && <p className="text-red-600 text-sm mt-3">⚠️ {saveError}</p>}
          <button
            type="submit"
            disabled={saving}
            className="mt-4 bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold disabled:opacity-50"
          >
            {saving ? "Saving..." : "Record Entry"}
          </button>
        </form>

        <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4">All entries</h2>
          {error && <p className="text-red-600 text-sm mb-3">⚠️ {error}</p>}
          {loading ? (
            <p className="text-gray-500 text-sm py-8 text-center">Loading...</p>
          ) : entries.length === 0 ? (
            <p className="text-gray-500 text-sm py-8 text-center">No entries recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Founder</th>
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2 pr-4">Amount</th>
                    <th className="py-2 pr-4">Method</th>
                    <th className="py-2 pr-4">Approved by</th>
                    <th className="py-2 pr-4">Notes</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => (
                    <tr key={e.id} className="border-b border-gray-50">
                      <td className="py-2 pr-4">{new Date(e.date).toISOString().split("T")[0]}</td>
                      <td className="py-2 pr-4 font-medium">{e.founderName}</td>
                      <td className="py-2 pr-4">
                        {e.type === "contribution" ? (
                          <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">In</span>
                        ) : (
                          <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">Out</span>
                        )}
                      </td>
                      <td className="py-2 pr-4 font-medium">GHS {e.amount.toLocaleString()}</td>
                      <td className="py-2 pr-4">{e.method || "—"}</td>
                      <td className="py-2 pr-4">{e.approvedBy || "—"}</td>
                      <td className="py-2 pr-4 text-gray-500">{e.notes || "—"}</td>
                      <td className="py-2 text-right">
                        <button onClick={() => handleDelete(e.id)} className="text-red-500 hover:text-red-700 text-xs">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FounderLedgerPage;
