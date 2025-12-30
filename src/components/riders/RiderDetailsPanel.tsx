import React from "react";
import type { Rider, RiderOrder } from "./RiderTypes";

interface RiderDetailsPanelProps {
  rider: Rider | null;
  orders: RiderOrder[];
  open: boolean;
  onClose: () => void;
}

const RiderDetailsPanel: React.FC<RiderDetailsPanelProps> = ({ rider, orders, open, onClose }) => {
  if (!open || !rider) return null;
  return (
    <div className="fixed inset-0 flex justify-end z-50">
      <div className="bg-white w-full max-w-md h-full shadow-xl border-l border-gray-100 pointer-events-auto flex flex-col" style={{ position: 'relative', zIndex: 50 }}>
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h2 className="text-xl font-bold">Rider Profile</h2>
          <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>&times;</button>
        </div>
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="mb-4">
            <div className="text-lg font-semibold text-gray-900">{rider.name}</div>
            <div className="text-sm text-gray-500">{rider.phone}</div>
          </div>
          <div className="mb-2 text-sm"><span className="font-medium">Zone:</span> {rider.zone}</div>
          <div className="mb-2 text-sm"><span className="font-medium">Vehicle:</span> {rider.vehicleType}</div>
          <div className="mb-2 text-sm"><span className="font-medium">Status:</span> <span className={`px-2 py-1 rounded text-xs font-semibold ${rider.status === "Online" ? "bg-green-100 text-green-700" : rider.status === "On Delivery" ? "bg-yellow-100 text-yellow-700" : "bg-gray-200 text-gray-600"}`}>{rider.status}</span></div>
          <div className="mb-2 text-sm"><span className="font-medium">Last Active:</span> {rider.lastActive}</div>
          <div className="mb-2 text-sm"><span className="font-medium">Lifetime Deliveries:</span> {rider.lifetimeDeliveries}</div>
          <div className="mb-2 text-sm"><span className="font-medium">Lifetime Earnings:</span> GHS {rider.lifetimeEarnings.toFixed(2)}</div>
          <div className="mb-2 text-sm"><span className="font-medium">Average Rating:</span> {rider.rating.toFixed(1)}</div>
          <div className="mb-4 text-sm"><span className="font-medium">Recent Orders:</span>
            <ul className="mt-2 space-y-1">
              {orders.map(order => (
                <li key={order.id} className="flex justify-between">
                  <span className="text-xs text-gray-700">Order {order.id}</span>
                  <span className="text-xs text-gray-500">GHS {order.total.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-30 pointer-events-none" onClick={onClose}></div>
    </div>
  );
};

export default RiderDetailsPanel;
