import React, { useState, useEffect } from "react";
import type { Subscription } from "../SubscriptionsPage";
import subscriptionsService from "../../services/subscriptionsService";

interface Props {
  subscriptions: Subscription[];
  onView: (sub: Subscription) => void;
}

interface SubscriptionWithItems extends Subscription {
  items?: Array<{
    productId: number;
    quantity: number;
    unitPrice: number;
    product: {
      nameEnglish: string;
      unitType: string;
    };
  }>;
}

const statusColors: Record<string, string> = {
  Active: "bg-green-100 text-green-700",
  Paused: "bg-amber-100 text-amber-700",
  Cancelled: "bg-gray-200 text-gray-600",
  Failed: "bg-red-100 text-red-700",
};

const SubscriptionsTable: React.FC<Props> = ({ subscriptions, onView }) => {
  const [subscriptionsWithItems, setSubscriptionsWithItems] = useState<SubscriptionWithItems[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFullSubscriptions();
  }, [subscriptions]);

  const loadFullSubscriptions = async () => {
    try {
      setLoading(true);
      // Fetch full subscription details for each subscription
      const withItems = await Promise.all(
        subscriptions.map(async (sub) => {
          try {
            const id = parseInt(sub.id.replace('SUB-', ''));
            const fullSub = await subscriptionsService.getSubscriptionById(id);
            return {
              ...sub,
              items: fullSub?.items || [],
            } as SubscriptionWithItems;
          } catch (error) {
            console.error(`Failed to fetch subscription ${sub.id}:`, error);
            return {
              ...sub,
              items: [],
            } as SubscriptionWithItems;
          }
        })
      );
      setSubscriptionsWithItems(withItems);
    } catch (error) {
      console.error("Failed to load subscriptions with items:", error);
      setSubscriptionsWithItems(subscriptions);
    } finally {
      setLoading(false);
    }
  };

  const getItemsPreview = (items: any[] | undefined) => {
    if (!items || items.length === 0) return "No items";
    const itemNames = items.slice(0, 2).map(i => i.product?.nameEnglish || "Item").join(", ");
    return items.length > 2 ? `${itemNames}... (+${items.length - 2})` : itemNames;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-4 overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-xs text-gray-500 font-semibold">
            <th className="py-2 px-2 text-left">Customer</th>
            <th className="py-2 px-2 text-left">Items</th>
            <th className="py-2 px-2 text-left">Frequency</th>
            <th className="py-2 px-2 text-left">Next Billing</th>
            <th className="py-2 px-2 text-left">Status</th>
            <th className="py-2 px-2 text-right">Last Charge</th>
            <th className="py-2 px-2 text-right">Total Spent</th>
            <th className="py-2 px-2 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {subscriptionsWithItems.map(sub => (
            <tr key={sub.id} className="border-t border-gray-100 hover:bg-gray-50">
              <td className="py-2 px-2 font-medium text-gray-800">{sub.customer}</td>
              <td className="py-2 px-2 text-xs text-gray-600">{getItemsPreview(sub.items)}</td>
              <td className="py-2 px-2">{sub.frequency}</td>
              <td className="py-2 px-2">{sub.nextBilling}</td>
              <td className="py-2 px-2">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[sub.status]}`}>{sub.status}</span>
              </td>
              <td className="py-2 px-2 text-right">GH₵ {sub.lastCharge.toLocaleString()}</td>
              <td className="py-2 px-2 text-right">GH₵ {sub.totalSpent.toLocaleString()}</td>
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
          {subscriptionsWithItems.length === 0 && (
            <tr>
              <td colSpan={8} className="py-8 text-center text-gray-400">No subscriptions found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default SubscriptionsTable;
