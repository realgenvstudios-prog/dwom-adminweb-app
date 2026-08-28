import React, { useState, useEffect } from "react";
import suppliersService from "../services/suppliersService";
import type { Supplier } from "../services/suppliersService";
import procurementService from "../services/procurementService";
import type { ProcurementRecord } from "../services/procurementService";
import productsService from "../services/productsService";

const emptySupplierForm = { name: "", contactName: "", phone: "", location: "", notes: "" };

// A purchase is one trip to one supplier that can cover several products —
// the trip-level fields (supplier, who bought it, trip notes) are shared,
// while each product gets its own line item.
type PurchaseLineItem = { productId: string; quantity: string; unitCost: string };
const emptyLineItem: PurchaseLineItem = { productId: "", quantity: "", unitCost: "" };
const emptyPurchaseTrip = { supplierId: "", purchasedBy: "", notes: "" };

const SuppliersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"purchases" | "suppliers">("purchases");

  // Suppliers
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [supplierForm, setSupplierForm] = useState(emptySupplierForm);
  const [editingSupplierId, setEditingSupplierId] = useState<number | null>(null);
  const [savingSupplier, setSavingSupplier] = useState(false);

  // Products (for the purchase form's product picker)
  const [products, setProducts] = useState<any[]>([]);

  // Record a purchase — one supplier/trip, one or more product line items
  const [purchaseTrip, setPurchaseTrip] = useState(emptyPurchaseTrip);
  const [purchaseItems, setPurchaseItems] = useState<PurchaseLineItem[]>([{ ...emptyLineItem }]);
  const [recordingPurchase, setRecordingPurchase] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);

  // Purchase history
  const [purchases, setPurchases] = useState<ProcurementRecord[]>([]);
  const [purchasesTotal, setPurchasesTotal] = useState(0);
  const [loadingPurchases, setLoadingPurchases] = useState(true);

  useEffect(() => {
    loadSuppliers();
    loadProducts();
    loadPurchases();
  }, []);

  const loadSuppliers = async () => {
    try {
      setLoadingSuppliers(true);
      const data = await suppliersService.getAll(true); // include inactive so they're still visible in the management table
      setSuppliers(data);
    } catch (err) {
      console.error("❌ [SuppliersPage] Failed to load suppliers:", err);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await productsService.getAll();
      setProducts(Array.isArray(data) ? data : data?.items || []);
    } catch (err) {
      console.error("❌ [SuppliersPage] Failed to load products:", err);
    }
  };

  const loadPurchases = async () => {
    try {
      setLoadingPurchases(true);
      const data = await procurementService.getAll({ take: 50 });
      setPurchases(data.items);
      setPurchasesTotal(data.total);
    } catch (err) {
      console.error("❌ [SuppliersPage] Failed to load purchase history:", err);
    } finally {
      setLoadingPurchases(false);
    }
  };

  const resetSupplierForm = () => {
    setSupplierForm(emptySupplierForm);
    setEditingSupplierId(null);
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierForm.name.trim()) return;
    try {
      setSavingSupplier(true);
      if (editingSupplierId) {
        await suppliersService.update(editingSupplierId, supplierForm);
      } else {
        await suppliersService.create(supplierForm);
      }
      resetSupplierForm();
      await loadSuppliers();
    } catch (err: any) {
      alert(err.message || "Failed to save supplier");
    } finally {
      setSavingSupplier(false);
    }
  };

  const handleEditSupplier = (s: Supplier) => {
    setEditingSupplierId(s.id);
    setSupplierForm({
      name: s.name,
      contactName: s.contactName || "",
      phone: s.phone || "",
      location: s.location || "",
      notes: s.notes || "",
    });
  };

  const handleDeactivateSupplier = async (s: Supplier) => {
    if (!window.confirm(`Deactivate ${s.name}? They'll be hidden from new purchases, but their history is kept.`)) return;
    try {
      await suppliersService.remove(s.id);
      await loadSuppliers();
    } catch (err: any) {
      alert(err.message || "Failed to deactivate supplier");
    }
  };

  const updateLineItem = (index: number, field: keyof PurchaseLineItem, value: string) => {
    setPurchaseItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const addLineItem = () => setPurchaseItems((prev) => [...prev, { ...emptyLineItem }]);

  const removeLineItem = (index: number) =>
    setPurchaseItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));

  const handleRecordPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setPurchaseError(null);
    setPurchaseSuccess(null);

    const supplierId = parseInt(purchaseTrip.supplierId, 10);
    if (!supplierId) {
      setPurchaseError("Please select a supplier.");
      return;
    }

    const parsedItems: { productId: number; quantity: number; unitCost: number }[] = [];
    for (const item of purchaseItems) {
      const productId = parseInt(item.productId, 10);
      const quantity = parseFloat(item.quantity);
      const unitCost = parseFloat(item.unitCost);
      if (!productId || !quantity || quantity <= 0 || isNaN(unitCost) || unitCost < 0) {
        setPurchaseError("Every product row needs a product selected, a positive quantity, and a valid cost.");
        return;
      }
      parsedItems.push({ productId, quantity, unitCost });
    }

    try {
      setRecordingPurchase(true);
      await procurementService.recordBatchPurchase({
        supplierId,
        items: parsedItems,
        purchasedBy: purchaseTrip.purchasedBy || undefined,
        notes: purchaseTrip.notes || undefined,
      });
      setPurchaseSuccess(
        `Purchase recorded — ${parsedItems.length} product${parsedItems.length > 1 ? "s" : ""}, inventory updated.`,
      );
      setPurchaseTrip(emptyPurchaseTrip);
      setPurchaseItems([{ ...emptyLineItem }]);
      await loadPurchases();
    } catch (err: any) {
      setPurchaseError(err.message || "Failed to record purchase");
    } finally {
      setRecordingPurchase(false);
    }
  };

  const combinedTotal = purchaseItems.reduce((sum, item) => {
    const q = parseFloat(item.quantity) || 0;
    const c = parseFloat(item.unitCost) || 0;
    return sum + q * c;
  }, 0);

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Suppliers & Purchases</h1>
          <p className="text-gray-600 mt-1">
            Record what you actually buy, from whom, and at what cost — the foundation for margin tracking.
          </p>
        </div>

        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setActiveTab("purchases")}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              activeTab === "purchases" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Record Purchase
          </button>
          <button
            onClick={() => setActiveTab("suppliers")}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              activeTab === "suppliers" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Suppliers ({suppliers.length})
          </button>
        </div>

        {activeTab === "purchases" ? (
          <>
            <section className="bg-white rounded-xl shadow p-6 mb-8">
              <h2 className="text-xl font-bold mb-4">Record a Purchase</h2>
              <p className="text-sm text-gray-500 mb-5">
                One supplier, one trip — add every product you bought from them below.
              </p>
              <form onSubmit={handleRecordPurchase}>
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

            <section className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-bold mb-4">Recent Purchases ({purchasesTotal})</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-gray-500 border-b bg-gray-50">
                      <th className="py-3 px-4 font-medium">Date</th>
                      <th className="py-3 px-4 font-medium">Product</th>
                      <th className="py-3 px-4 font-medium">Supplier</th>
                      <th className="py-3 px-4 font-medium">Qty</th>
                      <th className="py-3 px-4 font-medium">Unit Cost</th>
                      <th className="py-3 px-4 font-medium">Total</th>
                      <th className="py-3 px-4 font-medium">By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingPurchases ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-gray-500">
                          Loading…
                        </td>
                      </tr>
                    ) : purchases.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-gray-500">
                          No purchases recorded yet
                        </td>
                      </tr>
                    ) : (
                      purchases.map((p) => (
                        <tr key={p.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">{new Date(p.purchasedAt).toLocaleDateString()}</td>
                          <td className="py-3 px-4 font-medium">{p.Product?.nameEnglish}</td>
                          <td className="py-3 px-4">{p.Supplier?.name}</td>
                          <td className="py-3 px-4">{p.quantity}</td>
                          <td className="py-3 px-4">GH₵ {p.unitCost.toFixed(2)}</td>
                          <td className="py-3 px-4 font-semibold">GH₵ {p.totalCost.toFixed(2)}</td>
                          <td className="py-3 px-4 text-gray-500">{p.purchasedBy || "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : (
          <>
            <section className="bg-white rounded-xl shadow p-6 mb-8">
              <h2 className="text-xl font-bold mb-4">{editingSupplierId ? "Edit Supplier" : "Add Supplier"}</h2>
              <form onSubmit={handleSaveSupplier} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={supplierForm.name}
                    onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                  <input
                    type="text"
                    value={supplierForm.contactName}
                    onChange={(e) => setSupplierForm({ ...supplierForm, contactName: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Market / Location</label>
                  <input
                    type="text"
                    value={supplierForm.location}
                    onChange={(e) => setSupplierForm({ ...supplierForm, location: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Makola Market"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <input
                    type="text"
                    value={supplierForm.notes}
                    onChange={(e) => setSupplierForm({ ...supplierForm, notes: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2 flex gap-3">
                  <button
                    type="submit"
                    disabled={savingSupplier}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                  >
                    {savingSupplier ? "Saving…" : editingSupplierId ? "Save Changes" : "Add Supplier"}
                  </button>
                  {editingSupplierId && (
                    <button
                      type="button"
                      onClick={resetSupplierForm}
                      className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </section>

            <section className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-bold mb-4">All Suppliers</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-gray-500 border-b bg-gray-50">
                      <th className="py-3 px-4 font-medium">Name</th>
                      <th className="py-3 px-4 font-medium">Contact</th>
                      <th className="py-3 px-4 font-medium">Location</th>
                      <th className="py-3 px-4 font-medium">Products</th>
                      <th className="py-3 px-4 font-medium">Status</th>
                      <th className="py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingSuppliers ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-500">
                          Loading…
                        </td>
                      </tr>
                    ) : suppliers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-500">
                          No suppliers yet
                        </td>
                      </tr>
                    ) : (
                      suppliers.map((s) => (
                        <tr key={s.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{s.name}</td>
                          <td className="py-3 px-4 text-gray-600">
                            {s.contactName || "-"}
                            {s.phone ? ` · ${s.phone}` : ""}
                          </td>
                          <td className="py-3 px-4 text-gray-600">{s.location || "-"}</td>
                          <td className="py-3 px-4">{s.productCount ?? 0}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                s.active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"
                              }`}
                            >
                              {s.active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditSupplier(s)}
                                className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                              >
                                Edit
                              </button>
                              {s.active && (
                                <button
                                  onClick={() => handleDeactivateSupplier(s)}
                                  className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                                >
                                  Deactivate
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default SuppliersPage;
