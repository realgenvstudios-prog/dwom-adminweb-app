import type { Order } from "../OrderTypes";

interface PaymentInfoCardProps {
  order: Order;
  selectedPaymentStatus: string;
}

// Payment method/status/amount cards, plus the failed-payment banner and
// reference/promo call-outs. Split out of the former monolithic
// OrderDetailsDrawer.
export default function PaymentInfoCard({ order, selectedPaymentStatus }: PaymentInfoCardProps) {
  return (
    <div>
      <div className="text-sm font-bold text-gray-900 mb-3">💳 PAYMENT</div>

      {/* Failed payment banner */}
      {selectedPaymentStatus === 'failed' && (
        <div className="mb-3 flex items-center gap-2 bg-red-50 border border-red-300 rounded-lg px-4 py-3">
          <span className="text-red-600 text-lg">❌</span>
          <div>
            <div className="text-sm font-bold text-red-700">Payment Failed</div>
            <div className="text-xs text-red-600">This order's payment was not processed successfully.</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {/* Method */}
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-center">
          <div className="text-xs font-semibold text-gray-500 mb-1">METHOD</div>
          <div className="text-xl mb-0.5">
            {order.paymentMethod === 'card' ? '💳' : order.paymentMethod === 'momo' ? '📱' : '💵'}
          </div>
          <div className="text-sm font-bold text-gray-900">
            {order.paymentMethod === 'card' ? 'Card' : order.paymentMethod === 'momo' ? 'Mobile Money' : 'Cash on Delivery'}
          </div>
        </div>

        {/* Status */}
        <div className={`p-3 rounded-lg border text-center ${
          selectedPaymentStatus === 'paid' ? 'bg-green-50 border-green-200' :
          selectedPaymentStatus === 'failed' ? 'bg-red-50 border-red-200' :
          'bg-amber-50 border-amber-200'
        }`}>
          <div className="text-xs font-semibold text-gray-500 mb-1">STATUS</div>
          <div className="text-xl mb-0.5">
            {selectedPaymentStatus === 'paid' ? '✅' : selectedPaymentStatus === 'failed' ? '❌' : '⏳'}
          </div>
          <div className={`text-sm font-bold ${
            selectedPaymentStatus === 'paid' ? 'text-green-700' :
            selectedPaymentStatus === 'failed' ? 'text-red-700' :
            'text-amber-700'
          }`}>
            {selectedPaymentStatus === 'paid' ? 'Paid' : selectedPaymentStatus === 'failed' ? 'Failed' : 'Pending'}
          </div>
        </div>

        {/* Amount */}
        <div className={`p-3 rounded-lg border text-center ${selectedPaymentStatus === 'paid' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
          <div className="text-xs font-semibold text-gray-500 mb-1">AMOUNT</div>
          <div className="text-sm font-bold text-gray-900 mt-3">
            GHS {order.total?.toLocaleString() || '0'}
          </div>
          {selectedPaymentStatus === 'paid' && (
            <div className="text-xs text-green-600 mt-0.5">Collected</div>
          )}
        </div>
      </div>

      {/* Payment Reference */}
      {order.paymentRef && (
        <div className="mt-3 bg-purple-50 p-3 rounded-lg border border-purple-200">
          <div className="text-xs font-semibold text-purple-700 mb-1">PAYMENT REFERENCE</div>
          <div className="text-sm font-mono text-gray-900 break-all">{order.paymentRef}</div>
        </div>
      )}

      {/* Coupon / Subscription */}
      {(order.coupon || order.subscription) && (
        <div className="mt-3 bg-green-50 p-3 rounded-lg border border-green-200">
          <div className="text-xs font-semibold text-green-700 mb-1">PROMO / SUBSCRIPTION</div>
          <div className="text-sm text-gray-900">{order.coupon || order.subscription || '—'}</div>
        </div>
      )}
    </div>
  );
}
