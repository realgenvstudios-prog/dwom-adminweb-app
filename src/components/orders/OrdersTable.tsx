import React, { useState } from "react";
import type { Order } from "./OrderTypes";
import AssignRiderModal from "./AssignRiderModal";

interface Props {
  orders: Order[];
  onRowClick: (order: Order) => void;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

// All keys are lowercase — matches normalized orderStatus from backend
const statusColors: Record<string, string> = {
  sorting: "bg-gray-100 text-gray-700",
  ready: "bg-blue-100 text-blue-700",
  "rider on the way": "bg-orange-100 text-orange-700",
  "rider has arrived": "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

// All keys are lowercase — matches normalized paymentStatus from backend
const paymentColors: Record<string, string> = {
  paid: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  failed: "bg-red-100 text-red-700",
  cancelled: "bg-red-100 text-red-700",
};

const paymentMethodIcons: Record<string, string> = {
  card: "💳",
  momo: "📱",
  cash: "💵",
};

const getStatusDisplay = (status: string): string => {
  const map: Record<string, string> = {
    sorting: "Sorting",
    ready: "Ready",
    "rider on the way": "Rider on the Way",
    "rider has arrived": "Rider Has Arrived",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };
  return map[status] || status;
};

const getPaymentDisplay = (status: string): string => {
  const map: Record<string, string> = {
    paid: "Paid",
    pending: "Pending",
    failed: "Failed",
    cancelled: "Cancelled",
  };
  return map[status] || status;
};

const OrdersTable: React.FC<Props> = ({
  orders,
  onRowClick,
  page,
  pageSize,
  total,
  onPageChange,
}) => {
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const pageCount = Math.ceil(total / pageSize);

  const handleAssignRider = (orderId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedOrderId(orderId);
    setIsAssignModalOpen(true);
  };

  const handleRiderAssigned = () => {
    setIsAssignModalOpen(false);
    setSelectedOrderId(null);
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 font-semibold bg-gray-50">
              <th className="py-2 px-2 text-left">Order ID</th>
              <th className="py-2 px-2 text-left">Time</th>
              <th className="py-2 px-2 text-left">Customer</th>
              <th className="py-2 px-2 text-left">Zone</th>
              <th className="py-2 px-2 text-left">Rider</th>
              <th className="py-2 px-2 text-right">Items</th>
              <th className="py-2 px-2 text-right">Total (GHS)</th>
              <th className="py-2 px-2 text-center">Payment</th>
              <th className="py-2 px-2 text-center">Status</th>
              <th className="py-2 px-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, i) => (
              <tr
                key={order.id}
                className={`border-t border-gray-100 hover:bg-gray-50 cursor-pointer ${i % 2 === 1 ? "bg-gray-50" : ""}`}
                onClick={() => onRowClick(order)}
              >
                <td className="py-2 px-2 font-medium text-gray-800">
                  {order.id}
                </td>
                <td className="py-2 px-2">{order.time}</td>
                <td className="py-2 px-2">{order.customer}</td>
                <td className="py-2 px-2">{order.zone}</td>
                <td className="py-2 px-2">
                  {order.rider ? (
                    <div className="text-sm">
                      <div className="font-medium">{order.rider.name}</div>
                      <div className="text-xs text-gray-500">
                        {order.phone || "—"}
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="py-2 px-2 text-right">
                  {order.itemsCount ?? order.items?.length ?? 0}
                </td>
                <td className="py-2 px-2 text-right font-medium">
                  GHS {order.total.toLocaleString()}
                </td>
                <td className="py-2 px-2 text-center">
                  <div className="flex flex-col items-center gap-0.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${paymentColors[order.paymentStatus] || "bg-gray-100 text-gray-700"}`}
                    >
                      {getPaymentDisplay(order.paymentStatus)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {paymentMethodIcons[order.paymentMethod] || "💵"}{" "}
                      {order.paymentMethod?.toUpperCase() || "CASH"}
                    </span>
                  </div>
                </td>
                <td className="py-2 px-2 text-center">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[order.orderStatus] || "bg-gray-100 text-gray-700"}`}
                  >
                    {getStatusDisplay(order.orderStatus)}
                  </span>
                </td>
                <td className="py-2 px-2 text-center">
                  {!order.rider && order.orderStatus !== "cancelled" ? (
                    <button
                      onClick={(e) =>
                        handleAssignRider(
                          parseInt(order.id.replace("DW-ORD-", "")),
                          e
                        )
                      }
                      className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                    >
                      Assign
                    </button>
                  ) : (
                    <span className="text-xs text-gray-500">—</span>
                  )}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={10} className="py-8 text-center text-gray-400">
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {/* Pagination */}
        <div className="flex justify-between items-center px-4 py-2 border-t border-gray-100 bg-gray-50">
          <button
            className="px-3 py-1 rounded border text-sm disabled:opacity-50"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
          >
            Previous
          </button>
          <div className="flex gap-1 text-sm">
            {Array.from({ length: pageCount }, (_, i) => (
              <button
                key={i}
                className={`px-2 py-1 rounded ${page === i + 1 ? "bg-blue-100 text-blue-700 font-semibold" : "hover:bg-gray-200"}`}
                onClick={() => onPageChange(i + 1)}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            className="px-3 py-1 rounded border text-sm disabled:opacity-50"
            onClick={() => onPageChange(page + 1)}
            disabled={page === pageCount}
          >
            Next
          </button>
        </div>
      </div>

      {/* Assign Rider Modal */}
      {selectedOrderId && (
        <AssignRiderModal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          orderId={selectedOrderId}
          onSuccess={handleRiderAssigned}
        />
      )}
    </>
  );
};

export default OrdersTable;
