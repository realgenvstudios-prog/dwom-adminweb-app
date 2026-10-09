import type { Supplier } from "../../services/suppliersService";

interface SuppliersTableProps {
  suppliers: Supplier[];
  loadingSuppliers: boolean;
  onEdit: (s: Supplier) => void;
  onDeactivate: (s: Supplier) => void;
}

// All-suppliers management table. Split out of the former monolithic
// SuppliersPage.
export default function SuppliersTable({ suppliers, loadingSuppliers, onEdit, onDeactivate }: SuppliersTableProps) {
  return (
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
                        onClick={() => onEdit(s)}
                        className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                      >
                        Edit
                      </button>
                      {s.active && (
                        <button
                          onClick={() => onDeactivate(s)}
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
  );
}
