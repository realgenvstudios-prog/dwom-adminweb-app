import type { FormEvent } from "react";
import type { Supplier } from "../../services/suppliersService";
import type { PurchaseLineItem } from "./usePurchaseForm";

interface RecordPurchaseFormProps {
  suppliers: Supplier[];
  products: any[];
  purchaseTrip: { supplierId: string; purchasedBy: string; notes: string };
  setPurchaseTrip: (trip: { supplierId: string; purchasedBy: string; notes: string }) => void;
  purchaseItems: PurchaseLineItem[];
  updateLineItem: (index: number, field: keyof PurchaseLineItem, value: string) => void;
  addLineItem: () => void;
  removeLineItem: (index: number) => void;
  purchaseError: string | null;
  purchaseSuccess: string | null;
  recordingPurchase: boolean;
  combinedTotal: number;
  onSubmit: (e: FormEvent) => void;
}

// The "Record a Purchase" form: trip-level fields + per-product line
// items. Split out of the former monolithic SuppliersPage.
export default function RecordPurchaseForm({
  suppliers,
  products,
  purchaseTrip,
  setPurchaseTrip,
  purchaseItems,
  updateLineItem,
  addLineItem,
  removeLineItem,
  purchaseError,
  purchaseSuccess,
  recordingPurchase,
  combinedTotal,
  onSubmit,
}: RecordPurchaseFormProps) {
  return (
    <section className="bg-white rounded-xl shadow p-6 mb-8">
      <h2 className="text-xl font-bold mb-4">Record a Purchase</h2>
      <p className="text-sm text-gray-500 mb-5">
        One supplier, one trip — add every product you bought from them below.
      </p>
      <form onSubmit={onSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
            <select
              value={purchaseTrip.supplierId}
              onChange={(e) => setPurchaseTrip({ ...purchaseTrip, supplierId: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select supplier…</option>
              {suppliers.filter((s) => s.active).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {suppliers.filter((s) => s.active).length === 0 && (
              <p className="text-xs text-gray-500 mt-1">
                No suppliers yet — add one under the "Suppliers" tab first.
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purchased By (optional)</label>
            <input
              type="text"
              value={purchaseTrip.purchasedBy}
              onChange={(e) => setPurchaseTrip({ ...purchaseTrip, purchasedBy: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Ama"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trip Notes (optional)</label>
            <input
              type="text"
              value={purchaseTrip.notes}
              onChange={(e) => setPurchaseTrip({ ...purchaseTrip, notes: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Bought early to beat weekend price rise"
            />
          </div>
        </div>

        <div className="space-y-3 mb-4">
          {purchaseItems.map((item, index) => {
            const lineTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unitCost) || 0);
            return (
              <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-gray-50 rounded-lg p-3">
                <div className="md:col-span-4">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Product</label>
                  <select
                    value={item.productId}
                    onChange={(e) => updateLineItem(index, "productId", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select product…</option>
                    {products.map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.nameEnglish}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={item.quantity}
                    onChange={(e) => updateLineItem(index, "quantity", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Unit Cost (GH₵)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitCost}
                    onChange={(e) => updateLineItem(index, "unitCost", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Line Total</label>
                  <div className="w-full border border-gray-200 bg-white rounded-lg px-3 py-2 text-sm text-gray-700 font-semibold">
                    GH₵ {lineTotal.toFixed(2)}
                  </div>
                </div>
                <div className="md:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeLineItem(index)}
                    disabled={purchaseItems.length === 1}
                    className="text-xs px-2 py-2 rounded bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Remove this product"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={addLineItem}
          className="mb-6 text-sm px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium"
        >
          + Add another product
        </button>

        {purchaseError && <div className="text-red-600 text-sm mb-4">{purchaseError}</div>}
        {purchaseSuccess && <div className="text-green-600 text-sm mb-4">{purchaseSuccess}</div>}

        <div className="flex items-center justify-between border-t pt-4">
          <div className="text-lg font-bold text-gray-900">Trip Total: GH₵ {combinedTotal.toFixed(2)}</div>
          <button
            type="submit"
            disabled={recordingPurchase}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {recordingPurchase
              ? "Recording…"
              : `Record Purchase${purchaseItems.length > 1 ? ` (${purchaseItems.length} items)` : ""}`}
          </button>
        </div>
      </form>
    </section>
  );
}
