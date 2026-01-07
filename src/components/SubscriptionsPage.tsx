import React, { useState, useEffect } from "react";
import subscriptionsService, { type Subscription as DBSubscription } from "../services/subscriptionsService";
import SubscriptionsSummaryCards from "./subscriptions/SubscriptionsSummaryCards";
import SubscriptionsTrendChart from "./subscriptions/SubscriptionsTrendChart";
import UpcomingAndFailedRenewalsCard from "./subscriptions/UpcomingAndFailedRenewalsCard";
import SubscriptionsTable from "./subscriptions/SubscriptionsTable";
import SubscriptionDetailsDrawer from "./subscriptions/SubscriptionDetailsDrawer";

export type SubscriptionStatus = "Active" | "Paused" | "Cancelled" | "Failed";
export type SubscriptionFrequency = "Weekly" | "Biweekly" | "Monthly";

export interface Subscription {
  id: string;
  customer: string;
  plan: string;
  frequency: SubscriptionFrequency;
  nextBilling: string;
  status: SubscriptionStatus;
  lastCharge: number;
  totalSpent: number;
  phone?: string;
  email?: string;
  history?: Array<{ date: string; amount: number; status: "Success" | "Failed" }>;
}

const statusOptions = ["All", "Active", "Paused", "Cancelled", "Failed"];
const frequencyOptions = ["All", "Weekly", "Biweekly", "Monthly"];

const SubscriptionsPage: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [status, setStatus] = useState<string>("All");
  const [frequency, setFrequency] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const data = await subscriptionsService.getFilteredSubscriptions(status !== "All" ? status : undefined, frequency !== "All" ? frequency : undefined, search || undefined);
      
      // Transform backend data to match UI format
      const transformed = data.map((sub: DBSubscription) => {
        // Get plan name from first subscription item product
        const planName = sub.SubscriptionItem && sub.SubscriptionItem.length > 0
          ? (sub.SubscriptionItem[0].Product?.nameEnglish || "Subscription")
          : "Subscription";
        
        return {
          id: `SUB-${sub.id}`,
          customer: sub.User?.name || "Unknown",
          plan: planName,
          frequency: (sub.frequency as SubscriptionFrequency) || "Monthly",
          nextBilling: sub.nextBillingDate?.split('T')[0] || new Date().toISOString().split('T')[0],
          status: (sub.status?.charAt(0).toUpperCase() + sub.status?.slice(1) || "Active") as SubscriptionStatus,
          lastCharge: sub.lastChargeAmount || 0,
          totalSpent: sub.totalSpent || 0,
          phone: sub.User?.phoneNumber,
          email: sub.User?.email,
        };
      });

      setSubscriptions(transformed);
    } catch (error) {
      console.error("Failed to fetch subscriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [status, frequency, search]);

  const filtered = subscriptions.filter(sub =>
    (status === "All" || sub.status === status) &&
    (frequency === "All" || sub.frequency === frequency) &&
    (sub.customer.toLowerCase().includes(search.toLowerCase()) ||
      sub.plan.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4">
      <div className="max-w-screen-2xl mx-auto">
        {/* Header Row */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-5 mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 w-full sm:w-auto">
            <select className="border rounded-lg px-4 py-2 min-w-[140px] text-base" value={status} onChange={e => setStatus(e.target.value)}>
              {statusOptions.map(s => <option key={s}>{s}</option>)}
            </select>
            <select className="border rounded-lg px-4 py-2 min-w-[140px] text-base" value={frequency} onChange={e => setFrequency(e.target.value)}>
              {frequencyOptions.map(f => <option key={f}>{f}</option>)}
            </select>
            <input
              className="border rounded-lg px-4 py-2 min-w-[200px] flex-1 text-base"
              placeholder="Search by customer or plan…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <svg
              className="animate-spin h-8 w-8 text-blue-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <p className="ml-3 text-gray-600">Loading subscriptions...</p>
          </div>
        )}

        {/* Summary Cards */}
        {!loading && <SubscriptionsSummaryCards />}

        {/* Main Layout: Chart + Side Panel */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
            <div className="lg:col-span-8 flex flex-col gap-8">
              <SubscriptionsTrendChart />
              <SubscriptionsTable
                subscriptions={filtered}
                onView={(sub: Subscription) => { setSelectedSub(sub); setDrawerOpen(true); }}
              />
            </div>
            <div className="lg:col-span-4 flex flex-col gap-8">
              <UpcomingAndFailedRenewalsCard />
            </div>
          </div>
        )}

        <SubscriptionDetailsDrawer
          open={drawerOpen}
          subscription={selectedSub}
          onClose={() => setDrawerOpen(false)}
        />
      </div>
    </div>
  );
};

export default SubscriptionsPage;
