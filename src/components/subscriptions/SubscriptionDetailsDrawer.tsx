import React, { useState, useEffect } from "react";
import type { Subscription } from "../SubscriptionsPage";
import subscriptionsService from "../../services/subscriptionsService";

interface Props {
  open: boolean;
  subscription: Subscription | null;
  onClose: () => void;
}

interface SubscriptionItem {
  productId: number;
  quantity: number;
  unitPrice: number;
  product: {
    nameEnglish: string;
    unitType: string;
  };
}

const statusColors: Record<string, string> = {
  Active: "bg-green-100 text-green-700",
  Paused: "bg-amber-100 text-amber-700",
  Cancelled: "bg-gray-200 text-gray-600",
  Failed: "bg-red-100 text-red-700",
};

const SubscriptionDetailsDrawer: React.FC<Props> = ({ open, subscription, onClose }) => {
  const [items, setItems] = useState<SubscriptionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [localStatus, setLocalStatus] = useState<string>();

  useEffect(() => {
    if (open && subscription) {
      loadSubscriptionDetails();
      setLocalStatus(subscription.status);
    }
  }, [open, subscription]);

  const loadSubscriptionDetails = async () => {
    if (!subscription) return;
    try {
      setLoading(true);
      const id = parseInt(subscription.id.replace('SUB-', ''));
      const fullSub = await subscriptionsService.getSubscriptionById(id);
      setItems((fullSub as any)?.items || []);
    } catch (error) {
      console.error("Failed to load subscription items:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async () => {
    if (!subscription) return;
    try {
      setActionLoading(true);
      const id = parseInt(subscription.id.replace('SUB-', ''));
      const newStatus = localStatus === "Active" ? "paused" : "active";
      await subscriptionsService.updateSubscriptionStatus(id, newStatus);
      setLocalStatus(newStatus === "paused" ? "Paused" : "Active");
      alert(`Subscription ${newStatus === "paused" ? "paused" : "resumed"} successfully!`);
    } catch (error) {
      console.error("Failed to update subscription:", error);
      alert("Failed to update subscription status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!subscription) return;
    if (!confirm("Are you sure you want to cancel this subscription? This action cannot be undone.")) {
      return;
    }
    try {
      setActionLoading(true);
      const id = parseInt(subscription.id.replace('SUB-', ''));
      await subscriptionsService.updateSubscriptionStatus(id, "cancelled");
      setLocalStatus("Cancelled");
      alert("Subscription cancelled successfully!");
      onClose();
    } catch (error) {
      console.error("Failed to cancel subscription:", error);
      alert("Failed to cancel subscription");
    } finally {
      setActionLoading(false);
    }
  };

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
            <div className="font-semibold text-gray-700 mb-1">Frequency</div>
            <div className="text-gray-900 font-medium">{subscription.frequency}</div>
          </div>
          <div>
            <div className="font-semibold text-gray-700 mb-1">Status</div>
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[localStatus as any]}`}>{localStatus}</span>
            <div className="text-xs text-gray-500 mt-1">Next billing: {subscription.nextBilling}</div>
          </div>

          {/* Plan Items Section */}
          <div>
            <div className="font-semibold text-gray-700 mb-2">Subscription Items</div>
            {loading ? (
              <div className="text-xs text-gray-500">Loading items...</div>
            ) : items.length === 0 ? (
              <div className="text-xs text-gray-500">No items in subscription</div>
            ) : (
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="bg-gray-50 rounded p-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-xs font-medium text-gray-700">{item.product?.nameEnglish || "Product"}</div>
                        <div className="text-xs text-gray-500">
                          Qty: {item.quantity} × GH₵{(item.unitPrice || 0).toFixed(2)}
                        </div>
                      </div>
                      <div className="text-xs font-medium text-gray-700">
                        GH₵{((item.quantity || 1) * (item.unitPrice || 0)).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="font-semibold text-gray-700 mb-1">Financial Summary</div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Last Charge:</span>
                <span className="font-medium text-gray-900">GH₵ {subscription.lastCharge.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Spent:</span>
                <span className="font-medium text-gray-900">GH₵ {subscription.totalSpent.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-4">
            <button
              className={`flex-1 py-2 rounded-lg font-semibold transition ${
                localStatus === "Active"
                  ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                  : "bg-green-100 text-green-700 hover:bg-green-200"
              } ${actionLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={handlePause}
              disabled={actionLoading}
            >
              {actionLoading ? "Processing..." : localStatus === "Active" ? "Pause" : "Resume"}
            </button>
            <button
              className={`flex-1 py-2 rounded-lg bg-red-100 text-red-700 font-semibold hover:bg-red-200 transition ${
                actionLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={handleCancel}
              disabled={actionLoading || localStatus === "Cancelled"}
            >
              {actionLoading ? "Processing..." : "Cancel"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionDetailsDrawer;
