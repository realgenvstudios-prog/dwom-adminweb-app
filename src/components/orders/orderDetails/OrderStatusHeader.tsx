import type { Order } from "../OrderTypes";
import { ORDER_STATUSES, PAYMENT_STATUSES, getStatusLabel, getPaymentLabel, getStatusColor, getPaymentColor } from "./useOrderStatusActions";

interface OrderStatusHeaderProps {
  order: Order;
  onClose: () => void;
  loading: boolean;
  selectedStatus: string;
  selectedPaymentStatus: string;
  statusDropdownOpen: boolean;
  setStatusDropdownOpen: (open: boolean) => void;
  paymentDropdownOpen: boolean;
  setPaymentDropdownOpen: (open: boolean) => void;
  onUpdateStatus: (status: string) => void;
  onUpdatePaymentStatus: (status: string) => void;
  onOpenRiderModal: () => void;
}

// The drawer's sticky header: order id/customer, status pills, and the
// Change Status / Payment / Assign Rider action buttons with their
// dropdowns. Split out of the former monolithic OrderDetailsDrawer.
export default function OrderStatusHeader({
  order,
  onClose,
  loading,
  selectedStatus,
  selectedPaymentStatus,
  statusDropdownOpen,
  setStatusDropdownOpen,
  paymentDropdownOpen,
  setPaymentDropdownOpen,
  onUpdateStatus,
  onUpdatePaymentStatus,
  onOpenRiderModal,
}: OrderStatusHeaderProps) {
  return (
    <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-2xl font-bold text-gray-900">Order #{order.id}</div>
          <div className="text-sm text-gray-500">{order.customer}</div>
        </div>
        <button className="text-gray-400 hover:text-gray-600 p-1" onClick={onClose} aria-label="Close">
          <span className="text-2xl font-light">×</span>
        </button>
      </div>

      {/* Status Pills */}
      <div className="flex gap-3 flex-wrap mb-4">
        <div>
          <div className="text-xs font-medium text-gray-600 mb-1">Order Status</div>
          <div className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(selectedStatus)}`}>
            {getStatusLabel(selectedStatus)}
          </div>
        </div>
        <div>
          <div className="text-xs font-medium text-gray-600 mb-1">Payment</div>
          <div className={`px-3 py-1 rounded-full text-sm font-semibold border ${getPaymentColor(selectedPaymentStatus)}`}>
            {getPaymentLabel(selectedPaymentStatus)}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 flex-wrap">
        {/* Update Status */}
        <div className="relative">
          <button
            disabled={loading}
            onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            📊 Change Status
          </button>
          {statusDropdownOpen && (
            <div className="absolute top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-max">
              {ORDER_STATUSES.map(status => (
                <button
                  key={status}
                  onClick={() => onUpdateStatus(status)}
                  disabled={loading}
                  className="block w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 disabled:opacity-50 first:rounded-t-lg last:rounded-b-lg border-b last:border-b-0 border-gray-100"
                >
                  {getStatusLabel(status)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Update Payment Status */}
        <div className="relative">
          <button
            disabled={loading}
            onClick={() => setPaymentDropdownOpen(!paymentDropdownOpen)}
            className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 disabled:opacity-50 transition-colors"
          >
            💰 Payment
          </button>
          {paymentDropdownOpen && (
            <div className="absolute top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-max">
              {PAYMENT_STATUSES.map(status => (
                <button
                  key={status}
                  onClick={() => onUpdatePaymentStatus(status)}
                  disabled={loading}
                  className="block w-full text-left px-4 py-2.5 text-sm hover:bg-amber-50 disabled:opacity-50 first:rounded-t-lg last:rounded-b-lg border-b last:border-b-0 border-gray-100"
                >
                  {getPaymentLabel(status)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Assign/Reassign Rider */}
        <button
          disabled={loading}
          onClick={onOpenRiderModal}
          className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          🚴 {order.rider ? 'Reassign' : 'Assign'} Rider
        </button>
      </div>
    </div>
  );
}
