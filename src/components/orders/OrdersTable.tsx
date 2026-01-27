import React from "react";
import type { Order } from "./OrderTypes";

interface Props {
  orders: Order[];
  onRowClick: (order: Order) => void;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

const statusColors: Record<string, string> = {
  Delivered: "bg-green-100 text-green-700",
  "On the way": "bg-amber-100 text-amber-700",
  Ready: "bg-blue-100 text-blue-700",
  Preparing: "bg-indigo-100 text-indigo-700",
  Pending: "bg-gray-100 text-gray-700",
  Failed: "bg-red-100 text-red-700",
  Canceled: "bg-red-100 text-red-700",
};
const paymentColors: Record<string, string> = {
  Paid: "bg-green-100 text-green-700",
  Pending: "bg-amber-100 text-amber-700",
  Failed: "bg-red-100 text-red-700",
};

const OrdersTable: React.FC<Props> = ({ orders, onRowClick, page, pageSize, total, onPageChange }) => {
  const pageCount = Math.ceil(total / pageSize);
  return (
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
            <th className="py-2 px-2 text-center">Source</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order, i) => (
            <tr
              key={order.id}
              className={`border-t border-gray-100 hover:bg-gray-50 cursor-pointer ${i % 2 === 1 ? 'bg-gray-50' : ''}`}
              onClick={() => onRowClick(order)}
            >
              <td className="py-2 px-2 font-medium text-gray-800">{order.id}</td>
              <td className="py-2 px-2">{order.time}</td>
              <td className="py-2 px-2">{order.customer}</td>
              <td className="py-2 px-2">{order.zone}</td>
              <td className="py-2 px-2">{order.rider?.name || <span className="text-gray-400">—</span>}</td>
              <td className="py-2 px-2 text-right">{order.itemsCount ?? order.items.length}</td>
              <td className="py-2 px-2 text-right">GHS {order.total.toLocaleString()}</td>
              <td className="py-2 px-2 text-center">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${paymentColors[order.paymentStatus]}`}>{order.paymentStatus}</span>
              </td>
              <td className="py-2 px-2 text-center">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[order.orderStatus]}`}>{order.orderStatus}</span>
              </td>
              <td className="py-2 px-2 text-center">{order.source}</td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr>
              <td colSpan={10} className="py-8 text-center text-gray-400">No orders found.</td>
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
              className={`px-2 py-1 rounded ${page === i + 1 ? 'bg-blue-100 text-blue-700 font-semibold' : 'hover:bg-gray-200'}`}
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
  );
};

export default OrdersTable;
