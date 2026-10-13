import React, { useState, useEffect, useCallback } from "react";
import expensesService, { type Expense, EXPENSE_CATEGORIES } from "../../services/expensesService";
import { logger } from "../../utils/logger";

const today = () => new Date().toISOString().split("T")[0];

const emptyForm = {
  date: today(),
  category: EXPENSE_CATEGORIES[0],
  amount: "",
  isCapex: false,
  recurring: false,
  paidBy: "",
  paymentMethod: "",
  notes: "",
};

const ExpensesTab: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  const loadExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await expensesService.getAll(categoryFilter ? { category: categoryFilter } : undefined);
      setExpenses(data);
    } catch (err) {
      logger.error("Failed to load expenses:", err);
      setError("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, [categoryFilter]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) {
      setSaveError("Enter a valid amount");
      return;
    }
    try {
      setSaving(true);
      setSaveError(null);
      await expensesService.create({
        date: form.date,
        category: form.category,
        amount,
        isCapex: form.isCapex,
        recurring: form.recurring,
        paidBy: form.paidBy || undefined,
        paymentMethod: form.paymentMethod || undefined,
        notes: form.notes || undefined,
      });
      setForm(emptyForm);
      await loadExpenses();
    } catch (err) {
      logger.error("Failed to save expense:", err);
      setSaveError("Failed to save expense");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this expense?")) return;
    try {
      await expensesService.remove(id);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      logger.error("Failed to delete expense:", err);
      setError("Failed to delete expense");
    }
  };

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <>
      <p className="text-gray-600 mb-6">
        Operating costs — rent, salaries, kayayie/rider fees, packaging. Capex and founder capital are tracked separately.
      </p>

      <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-xl border border-gray-100 p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Record an expense</h2>
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
            <label className="block text-sm text-gray-600 mb-1">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2"
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
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
            <label className="block text-sm text-gray-600 mb-1">Paid by</label>
            <input
              type="text"
              value={form.paidBy}
              onChange={(e) => setForm({ ...form, paidBy: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Payment method</label>
            <input
              type="text"
              value={form.paymentMethod}
              onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2"
              placeholder="cash, mobile money..."
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
          <div className="flex items-center gap-4 md:col-span-2">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={form.isCapex}
                onChange={(e) => setForm({ ...form, isCapex: e.target.checked })}
              />
              Capex (equipment/asset, not opex)
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={form.recurring}
                onChange={(e) => setForm({ ...form, recurring: e.target.checked })}
              />
              Recurring
            </label>
          </div>
        </div>
        {saveError && <p className="text-red-600 text-sm mt-3">⚠️ {saveError}</p>}
        <button
          type="submit"
          disabled={saving}
          className="mt-4 bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold disabled:opacity-50"
        >
          {saving ? "Saving..." : "Record Expense"}
        </button>
      </form>

      <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            Expenses {categoryFilter ? `— ${categoryFilter}` : ""}{" "}
            <span className="text-gray-400 font-normal text-sm">(GHS {total.toLocaleString()} total)</span>
          </h2>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
          >
            <option value="">All categories</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {error && <p className="text-red-600 text-sm mb-3">⚠️ {error}</p>}

        {loading ? (
          <p className="text-gray-500 text-sm py-8 text-center">Loading...</p>
        ) : expenses.length === 0 ? (
          <p className="text-gray-500 text-sm py-8 text-center">No expenses recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Category</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Paid by</th>
                  <th className="py-2 pr-4">Notes</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id} className="border-b border-gray-50">
                    <td className="py-2 pr-4">{new Date(e.date).toISOString().split("T")[0]}</td>
                    <td className="py-2 pr-4">{e.category}</td>
                    <td className="py-2 pr-4 font-medium">GHS {e.amount.toLocaleString()}</td>
                    <td className="py-2 pr-4">
                      {e.isCapex ? (
                        <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">Capex</span>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Opex</span>
                      )}
                    </td>
                    <td className="py-2 pr-4">{e.paidBy || "—"}</td>
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
    </>
  );
};

export default ExpensesTab;
