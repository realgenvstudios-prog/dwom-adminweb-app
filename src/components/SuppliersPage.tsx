import React, { useState, useEffect } from "react";
import suppliersService from "../services/suppliersService";
import type { Supplier } from "../services/suppliersService";
import procurementService from "../services/procurementService";
import type { ProcurementRecord } from "../services/procurementService";
import productsService from "../services/productsService";

const emptySupplierForm = { name: "", contactName: "", phone: "", location: "", notes: "" };
const emptyPurchaseForm = { productId: "", supplierId: "", quantity: "", unitCost: "", purchasedBy: "", notes: "" };

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

  // Record a purchase
  const [purchaseForm, setPurchaseForm] = useState(emptyPurchaseForm);
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

  const handleRecordPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setPurchaseError(null);
    setPurchaseSuccess(null);

    const productId = parseInt(purchaseForm.productId, 10);
    const supplierId = parseInt(purchaseForm.supplierId, 10);
    const quantity = parseFloat(purchaseForm.quantity);
    const unitCost = parseFloat(purchaseForm.unitCost);

    if (!productId || !supplierId || !quantity || quantity <= 0 || isNaN(unitCost) || unitCost < 0) {
      setPurchaseError("Please select a product and supplier, and enter a positive quantity and a valid cost.");
      return;
    }

    try {
      setRecordingPurchase(true);
      await procurementService.recordPurchase({
        productId,
        supplierId,
        quantity,
        unitCost,
        purchasedBy: purchaseForm.purchasedBy || undefined,
        notes: purchaseForm.notes || undefined,
      });
      setPurchaseSuccess("Purchase recorded — inventory updated.");
      setPurchaseForm(emptyPurchaseForm);
      await loadPurchases();
    } catch (err: any) {
      setPurchaseError(err.message || "Failed to record purchase");
    } finally {
      setRecordingPurchase(false);
    }
  };

  const totalCost = (parseFloat(purchaseForm.quantity) || 0) * (parseFloat(purchaseForm.unitCost) || 0);

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
              <form onSubmit={handleRecordPurchase} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                  <select
                    value={purchaseForm.productId}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, productId: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                  <select
                    value={purchaseForm.supplierId}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, supplierId: e.target.value })}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={purchaseForm.quantity}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, quantity: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost (GH₵)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={purchaseForm.unitCost}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, unitCost: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purchased By (optional)</label>
                  <input
                    type="text"
                    value={purchaseForm.purchasedBy}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, purchasedBy: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Ama"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Cost</label>
                  <div className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-gray-700 font-semibold">
                    GH₵ {totalCost.toFixed(2)}
                  </div>
                </div>
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                  <input
                    type="text"
                    value={purchaseForm.notes}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, notes: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Bought early to beat weekend price rise"
                  />
                </div>
                {purchaseError && <div className="md:col-span-3 text-red-600 text-sm">{purchaseError}</div>}
                {purchaseSuccess && <div className="md:col-span-3 text-green-600 text-sm">{purchaseSuccess}</div>}
                <div className="md:col-span-3">
                  <button
                    type="submit"
                    disabled={recordingPurchase}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                  >
                    {recordingPurchase ? "Recording…" : "Record Purchase"}
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
