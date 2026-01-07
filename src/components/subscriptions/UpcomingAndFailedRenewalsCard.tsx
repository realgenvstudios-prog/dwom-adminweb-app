import React, { useState, useEffect } from "react";
import subscriptionsService, { type Subscription } from "../../services/subscriptionsService";

interface UpcomingRenewal {
  customer: string;
  plan: string;
  date: string;
  amount: number;
}

interface FailedRenewal {
  customer: string;
  plan: string;
  date: string;
  reason: string;
}

const UpcomingAndFailedRenewalsCard: React.FC = () => {
  const [upcoming, setUpcoming] = useState<UpcomingRenewal[]>([]);
  const [failed, setFailed] = useState<FailedRenewal[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRenewals();
  }, []);

  const fetchRenewals = async () => {
    try {
      setLoading(true);
      
      // Get subscriptions due today (which represents upcoming renewals)
      const dueSubs = await subscriptionsService.getSubscriptionsDueToday();
      const upcomingData = dueSubs
        .filter((sub: Subscription) => sub.status === "Active")
        .slice(0, 3)
        .map((sub: Subscription) => ({
          customer: (sub as any).User?.name || "Unknown",
          plan: (sub as any).SubscriptionPlan?.name || "Plan",
          date: sub.nextBillingDate?.split('T')[0] || new Date().toISOString().split('T')[0],
          amount: (sub as any).SubscriptionPlan?.price || 0,
        }));

      setUpcoming(upcomingData);

      // Get failed subscriptions
      const allSubs = await subscriptionsService.getAllSubscriptions();
      const failedData = allSubs
        .filter((sub: Subscription) => sub.status === "Failed")
        .slice(0, 2)
        .map((sub: Subscription) => ({
          customer: (sub as any).User?.name || "Unknown",
          plan: (sub as any).SubscriptionPlan?.name || "Plan",
          date: sub.updatedAt?.split('T')[0] || new Date().toISOString().split('T')[0],
          reason: "Payment failed",
        }));

      setFailed(failedData);
    } catch (error) {
      console.error("Failed to fetch renewals:", error);
      setUpcoming([]);
      setFailed([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-5 flex flex-col gap-8">
        <div className="h-40 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-24 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-5 flex flex-col gap-8">
      <div>
        <div className="font-semibold text-gray-800 mb-2">Upcoming Renewals (Next 7 Days)</div>
        {upcoming.length > 0 ? (
          <ul className="divide-y divide-gray-100">
            {upcoming.map((item, i) => (
              <li key={i} className="py-2 flex flex-col gap-0.5">
                <span className="font-medium text-gray-700">{item.customer}</span>
                <span className="text-xs text-gray-500">{item.plan} • {item.date}</span>
                <span className="text-xs text-blue-600 font-semibold">GHS {item.amount}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-gray-400">No upcoming renewals</p>
        )}
      </div>
      <div>
        <div className="font-semibold text-gray-800 mb-2">Recent Failed Renewals</div>
        {failed.length > 0 ? (
          <ul className="divide-y divide-gray-100">
            {failed.map((item, i) => (
              <li key={i} className="py-2 flex flex-col gap-0.5">
                <span className="font-medium text-gray-700">{item.customer}</span>
                <span className="text-xs text-gray-500">{item.plan} • {item.date}</span>
                <span className="text-xs text-red-600 font-semibold">{item.reason}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-gray-400">No failed renewals</p>
        )}
      </div>
    </div>
  );
};

export default UpcomingAndFailedRenewalsCard;
