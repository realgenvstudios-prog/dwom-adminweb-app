import type { ProcurementRecord } from "../../services/procurementService";

interface PurchaseHistoryTableProps {
  purchases: ProcurementRecord[];
  purchasesTotal: number;
  loadingPurchases: boolean;
}

// Recent purchases table. Split out of the former monolithic
// SuppliersPage.
export default function PurchaseHistoryTable({ purchases, purchasesTotal, loadingPurchases }: PurchaseHistoryTableProps) {
  return (
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
  );
}
