import React from "react";
import type { Subscription } from "../SubscriptionsPage";

interface Props {
  open: boolean;
  subscription: Subscription | null;
  onClose: () => void;
}

const statusColors: Record<string, string> = {
  Active: "bg-green-100 text-green-700",
  Paused: "bg-amber-100 text-amber-700",
  Cancelled: "bg-gray-200 text-gray-600",
  Failed: "bg-red-100 text-red-700",
};

const SubscriptionDetailsDrawer: React.FC<Props> = ({ open, subscription, onClose }) => {
  if (!open || !subscription) return null;
  return (
    <div className="fixed inset-0 z-40 flex">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity pointer-events-auto" onClick={onClose} />
      {/* Drawer */}
      <div className="ml-auto w-full max-w-md bg-white h-full shadow-xl flex flex-col pointer-events-auto" style={{zIndex: 50}}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="text-lg font-bold text-gray-900">Subscription Details</div>
          <button className="text-gray-400 hover:text-gray-700" onClick={onClose} aria-label="Close">
            <span className="text-2xl">×</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-6">
          <div>
            <div className="font-semibold text-gray-700 mb-1">Customer</div>
            <div className="text-gray-900 font-bold text-lg">{subscription.customer}</div>
            <div className="text-xs text-gray-500">{subscription.phone} • {subscription.email}</div>
          </div>
          <div>
            <div className="font-semibold text-gray-700 mb-1">Plan</div>
            <div className="text-gray-900 font-medium">{subscription.plan} <span className="text-xs text-gray-400 ml-2">({subscription.frequency})</span></div>
          </div>
          <div>
            <div className="font-semibold text-gray-700 mb-1">Status</div>
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[subscription.status]}`}>{subscription.status}</span>
            <div className="text-xs text-gray-500 mt-1">Next billing: {subscription.nextBilling}</div>
          </div>
          <div>
            <div className="font-semibold text-gray-700 mb-1">Plan Items</div>
            <div className="text-xs text-gray-500">(Mock) Rice, Oil, Eggs, Tomatoes, Onions, etc.</div>
          </div>
          <div>
            <div className="font-semibold text-gray-700 mb-1">Recent Charges</div>
            <ul className="divide-y divide-gray-100">
              {subscription.history?.slice(0, 5).map((h, i) => (
                <li key={i} className="py-2 flex items-center justify-between">
                  <span className="text-xs text-gray-500">{h.date}</span>
                  <span className="text-xs font-semibold text-gray-700">GHS {h.amount}</span>
                  <span className={`text-xs font-semibold ${h.status === "Success" ? "text-green-600" : "text-red-600"}`}>{h.status}</span>
                </li>
              ))}
            </ul>
          </div>
          {/* Actions */}
          <div className="flex gap-4 mt-4">
            <button
              className="flex-1 py-2 rounded-lg bg-amber-100 text-amber-700 font-semibold hover:bg-amber-200 transition"
              onClick={() => console.log('Pause', subscription.id)}
            >
              Pause
            </button>
            <button
              className="flex-1 py-2 rounded-lg bg-red-100 text-red-700 font-semibold hover:bg-red-200 transition"
              onClick={() => console.log('Cancel', subscription.id)}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionDetailsDrawer;
