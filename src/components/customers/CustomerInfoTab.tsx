import type { Customer } from "./CustomerTypes";
import { formatDate } from "./CustomerTypes";

interface CustomerInfoTabProps {
  customer: Customer;
}

// The "Info & Stats" tab of the customer detail sidebar. Split out of the
// former monolithic CustomersPage.
export default function CustomerInfoTab({ customer }: CustomerInfoTabProps) {
  return (
    <div className="space-y-5">
      {/* Contact Info */}
      <div className="space-y-2">
        <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Contact</h5>
        <div className="space-y-2">
          <div className="flex items-center gap-2.5 text-sm">
            <span className="text-gray-400">📧</span>
            <span className="text-gray-800">{customer.email || 'No email'}</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm">
            <span className="text-gray-400">🆔</span>
            <span className="text-gray-800">Customer #{customer.id}</span>
          </div>
          <div className="flex items-start gap-2.5 text-sm">
            <span className="text-gray-400 mt-0.5">📍</span>
            <span className="text-gray-800">{customer.address || 'No address saved'}</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm">
            <span className="text-gray-400">📅</span>
            <span className="text-gray-800">Joined {formatDate(customer.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-2">
        <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Statistics</h5>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-gray-900">{customer.totalOrders}</div>
            <div className="text-xs text-gray-500">Orders</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-gray-900">GHS {customer.totalSpend.toFixed(2)}</div>
            <div className="text-xs text-gray-500">Total Spent</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-gray-900">GHS {customer.avgOrder.toFixed(2)}</div>
            <div className="text-xs text-gray-500">Avg Order</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-sm font-medium text-gray-900">{customer.lastOrder ? formatDate(customer.lastOrder) : '—'}</div>
            <div className="text-xs text-gray-500">Last Order</div>
          </div>
        </div>
      </div>
    </div>
  );
}
