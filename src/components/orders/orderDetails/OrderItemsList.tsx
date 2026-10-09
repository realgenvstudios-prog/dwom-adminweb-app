import type { Order } from "../OrderTypes";

interface OrderItemsListProps {
  items: Order['items'];
  loading: boolean;
  error: string | null;
}

// The order's product/bundle line items. Split out of the former
// monolithic OrderDetailsDrawer.
export default function OrderItemsList({ items, loading, error }: OrderItemsListProps) {
  return (
    <div>
      <div className="text-sm font-bold text-gray-900 mb-3">📦 ORDER ITEMS ({items.length})</div>
      {loading ? (
        <div className="py-4 text-sm text-gray-500 text-center">Loading items…</div>
      ) : error ? (
        <div className="py-4 text-sm text-red-600 text-center">❌ {error}</div>
      ) : items.length === 0 ? (
        <div className="py-4 text-sm text-gray-400 text-center">— No items found</div>
      ) : (
        <div className="bg-gray-50 rounded-lg divide-y">
          {items.map((item, i) => (
            <div key={item.id || i} className="p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700"><strong>{item.quantity}x</strong> {item.name}</span>
                <span className="text-sm font-bold text-gray-900">
                  {(item as any).originalPrice ? (
                    <>
                      <span className="line-through text-gray-400 font-normal mr-1">GHS {(item as any).originalPrice.toLocaleString()}</span>
                      GHS {item.price.toLocaleString()}
                    </>
                  ) : (
                    `GHS ${item.price.toLocaleString()}`
                  )}
                </span>
              </div>
              {(item as any).notes && (
                <div className="mt-1.5 flex items-start gap-1.5 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                  <span className="text-xs text-amber-800">📝 <strong>Note:</strong> {(item as any).notes}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
