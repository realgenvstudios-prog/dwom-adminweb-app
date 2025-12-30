import React from "react";
import type { Subscription } from "../SubscriptionsPage";

interface Props {
  subscriptions: Subscription[];
  onView: (sub: Subscription) => void;
}

const statusColors: Record<string, string> = {
  Active: "bg-green-100 text-green-700",
  Paused: "bg-amber-100 text-amber-700",
  Cancelled: "bg-gray-200 text-gray-600",
  Failed: "bg-red-100 text-red-700",
};

const SubscriptionsTable: React.FC<Props> = ({ subscriptions, onView }) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-4 overflow-x-auto">
    <table className="min-w-full text-sm">
      <thead>
        <tr className="text-xs text-gray-500 font-semibold">
          <th className="py-2 px-2 text-left">Customer</th>
          <th className="py-2 px-2 text-left">Plan</th>
          <th className="py-2 px-2 text-left">Frequency</th>
          <th className="py-2 px-2 text-left">Next Billing</th>
          <th className="py-2 px-2 text-left">Status</th>
          <th className="py-2 px-2 text-right">Last Charge</th>
          <th className="py-2 px-2 text-right">Total Spent</th>
          <th className="py-2 px-2 text-center">Actions</th>
        </tr>
      </thead>
      <tbody>
        {subscriptions.map(sub => (
          <tr key={sub.id} className="border-t border-gray-100 hover:bg-gray-50">
            <td className="py-2 px-2 font-medium text-gray-800">{sub.customer}</td>
            <td className="py-2 px-2">{sub.plan}</td>
            <td className="py-2 px-2">{sub.frequency}</td>
            <td className="py-2 px-2">{sub.nextBilling}</td>
            <td className="py-2 px-2">
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[sub.status]}`}>{sub.status}</span>
            </td>
            <td className="py-2 px-2 text-right">GHS {sub.lastCharge.toLocaleString()}</td>
            <td className="py-2 px-2 text-right">GHS {sub.totalSpent.toLocaleString()}</td>
            <td className="py-2 px-2 text-center">
              <button
                className="text-blue-600 hover:underline font-semibold whitespace-nowrap"
                onClick={() => onView(sub)}
              >
                View
              </button>
            </td>
          </tr>
        ))}
        {subscriptions.length === 0 && (
          <tr>
            <td colSpan={8} className="py-8 text-center text-gray-400">No subscriptions found.</td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

export default SubscriptionsTable;
