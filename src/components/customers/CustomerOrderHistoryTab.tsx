import type { CustomerOrder } from "./CustomerTypes";
import { formatDate } from "./CustomerTypes";

interface CustomerOrderHistoryTabProps {
  orderHistoryLoading: boolean;
  orderHistory: CustomerOrder[];
  expandedOrderId: number | null;
  setExpandedOrderId: (id: number | null) => void;
}

// The "Order History" tab of the customer detail sidebar — a list of
// orders that expand to show items/breakdown/payment. Split out of the
// former monolithic CustomersPage.
export default function CustomerOrderHistoryTab({
  orderHistoryLoading,
  orderHistory,
  expandedOrderId,
  setExpandedOrderId,
}: CustomerOrderHistoryTabProps) {
  if (orderHistoryLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <svg className="animate-spin h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  if (orderHistory.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="text-4xl mb-2">🛒</div>
        <p className="text-gray-500 text-sm">No orders yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orderHistory.map(order => (
        <div key={order.id} className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Order Header - always visible */}
          <button
            className="w-full text-left p-3 hover:bg-gray-50 transition"
            onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-gray-900 text-sm">Order #{order.id}</span>
              <span className="text-sm font-bold text-gray-900">GHS {order.total.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{formatDate(order.createdAt)}</span>
              <div className="flex gap-1.5">
                <span className={`px-1.5 py-0.5 rounded-full font-medium ${
                  order.paymentStatus === 'completed' || order.paymentStatus === 'paid'
                    ? 'bg-green-100 text-green-700'
                    : order.paymentStatus === 'pending'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                }`}>{order.paymentStatus}</span>
                <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium capitalize">{order.status}</span>
              </div>
            </div>
          </button>

          {/* Expanded Order Details */}
          {expandedOrderId === order.id && (
            <div className="border-t border-gray-100 bg-gray-50 p-3 space-y-3">
              {/* Items */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Items</p>
                <div className="space-y-1.5">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start text-xs">
                      <div className="text-gray-800">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-gray-500 ml-1">× {item.quantity}</span>
                      </div>
                      <span className="text-gray-700 font-medium ml-2 shrink-0">GHS {item.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Breakdown */}
              <div className="border-t border-gray-200 pt-2 space-y-1 text-xs">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span><span>GHS {order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Delivery</span><span>GHS {order.deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Service fee</span><span>GHS {order.serviceFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold text-gray-900 border-t border-gray-200 pt-1">
                  <span>Total</span><span>GHS {order.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment & Address */}
              <div className="border-t border-gray-200 pt-2 space-y-1 text-xs text-gray-600">
                <div className="flex gap-1.5 items-center">
                  <span>💳</span>
                  <span className="capitalize">{order.paymentMethod || 'N/A'}</span>
                </div>
                {order.address && (
                  <div className="flex gap-1.5 items-start">
                    <span className="mt-0.5">📍</span>
                    <span>{order.address}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
