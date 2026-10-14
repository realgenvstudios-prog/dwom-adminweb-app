import type { FormEvent } from "react";
import type { Product } from "../../services/productsService";
import type { SupplierProductLink } from "../../services/suppliersService";

interface SupplierFormProps {
  editingSupplierId: number | null;
  supplierForm: { name: string; contactName: string; phone: string; location: string; notes: string };
  setSupplierForm: (form: SupplierFormProps['supplierForm']) => void;
  savingSupplier: boolean;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
  allProducts: Product[];
  linkedProducts: SupplierProductLink[];
  linkingProductId: number | null;
  onToggleProductLink: (productId: number) => void;
}

// The add/edit supplier form, plus which products this supplier provides
// — a direct link, not dependent on ever logging a purchase. Split out
// of the former monolithic SuppliersPage.
export default function SupplierForm({
  editingSupplierId,
  supplierForm,
  setSupplierForm,
  savingSupplier,
  onSubmit,
  onCancel,
  allProducts,
  linkedProducts,
  linkingProductId,
  onToggleProductLink,
}: SupplierFormProps) {
  const linkedProductIds = new Set(linkedProducts.map((l) => l.productId));
  return (
    <section className="bg-white rounded-xl shadow-sm p-6 mb-8">
      <h2 className="text-xl font-bold mb-4">{editingSupplierId ? "Edit Supplier" : "Add Supplier"}</h2>
      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={supplierForm.name}
            onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
          <input
            type="text"
            value={supplierForm.contactName}
            onChange={(e) => setSupplierForm({ ...supplierForm, contactName: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            type="text"
            value={supplierForm.phone}
            onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Market / Location</label>
          <input
            type="text"
            value={supplierForm.location}
            onChange={(e) => setSupplierForm({ ...supplierForm, location: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Makola Market"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <input
            type="text"
            value={supplierForm.notes}
            onChange={(e) => setSupplierForm({ ...supplierForm, notes: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
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
              onClick={onCancel}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {editingSupplierId && (
        <div className="mt-6 pt-6 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Products this supplier provides ({linkedProductIds.size})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
            {allProducts.map((p) => {
              const isLinked = linkedProductIds.has(p.id);
              return (
                <label
                  key={p.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer ${
                    isLinked ? "bg-blue-50 border-blue-200" : "border-gray-200"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isLinked}
                    disabled={linkingProductId === p.id}
                    onChange={() => onToggleProductLink(p.id)}
                    className="rounded-sm border-gray-300"
                  />
                  {p.nameEnglish}
                </label>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
