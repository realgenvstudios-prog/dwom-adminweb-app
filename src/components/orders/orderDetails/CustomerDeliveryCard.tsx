import type { Order } from "../OrderTypes";

interface CustomerDeliveryCardProps {
  order: Order;
  recipientInfo: { name?: string; phone?: string } | null;
}

// Customer/rider info cards, delivery address, and the customer-facing
// timeline. Split out of the former monolithic OrderDetailsDrawer.
export default function CustomerDeliveryCard({ order, recipientInfo }: CustomerDeliveryCardProps) {
  return (
    <>
      {/* Customer & Delivery Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-xs font-semibold text-gray-600 mb-2">CUSTOMER</div>
          <div className="text-lg font-bold text-gray-900">{order.customer}</div>
          <div className="text-sm text-gray-600 mt-1">{order.phone}</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-xs font-semibold text-gray-600 mb-2">RIDER</div>
          <div className="text-lg font-bold text-gray-900">{order.rider?.name || '—'}</div>
          <div className={`text-sm mt-1 ${order.rider ? 'text-green-700' : 'text-gray-600'}`}>
            {order.rider ? '✓ Assigned' : 'Not assigned'}
          </div>
        </div>
      </div>

      {/* Delivery Address */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <div className="text-xs font-semibold text-blue-700 mb-2">📍 DELIVERY ADDRESS</div>
        <div className="text-gray-900 font-medium">{order.address}</div>
        <div className="text-sm text-gray-600 mt-1">{order.zone}</div>
        {recipientInfo && (
          <div className="mt-3 pt-3 border-t border-blue-200">
            <div className="text-xs font-semibold text-blue-700 mb-1">HAND TO</div>
            <div className="text-sm text-gray-900">
              {recipientInfo.name || '—'}
              {recipientInfo.phone ? ` · ${recipientInfo.phone}` : ''}
            </div>
          </div>
        )}
      </div>

      {/* Timeline */}
      {order.timeline && order.timeline.length > 0 && (
        <div>
          <div className="text-sm font-bold text-gray-900 mb-3">⏱️ TIMELINE</div>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            {order.timeline.map((t, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{t.time}</span>
                <span className="font-semibold text-gray-900">{t.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
