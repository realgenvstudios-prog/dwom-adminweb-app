import type { FormEvent } from "react";

interface SupplierFormProps {
  editingSupplierId: number | null;
  supplierForm: { name: string; contactName: string; phone: string; location: string; notes: string };
  setSupplierForm: (form: SupplierFormProps['supplierForm']) => void;
  savingSupplier: boolean;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
}

// The add/edit supplier form. Split out of the former monolithic
// SuppliersPage.
export default function SupplierForm({
  editingSupplierId,
  supplierForm,
  setSupplierForm,
  savingSupplier,
  onSubmit,
  onCancel,
}: SupplierFormProps) {
  return (
    <section className="bg-white rounded-xl shadow p-6 mb-8">
      <h2 className="text-xl font-bold mb-4">{editingSupplierId ? "Edit Supplier" : "Add Supplier"}</h2>
      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              onClick={onCancel}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
