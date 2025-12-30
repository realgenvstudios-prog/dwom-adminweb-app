import React, { useState, useEffect } from "react";
import subscriptionsService from "../../services/subscriptionsService";

interface CardData {
  label: string;
  value: string | number;
  sub: string;
  trend: string;
  color: string;
}

const SubscriptionsSummaryCards: React.FC = () => {
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const stats = await subscriptionsService.getSummaryStats();

      const cardData: CardData[] = [
        {
          label: "Active Subscriptions",
          value: stats.active || 0,
          sub: "Currently active",
          trend: "+0",
          color: "text-green-600",
        },
        {
          label: "Monthly Recurring Revenue (MRR)",
          value: `GHS ${(stats.mrr || 0).toLocaleString()}`,
          sub: "Monthly recurring",
          trend: stats.mrr ? "+Stable" : "N/A",
          color: "text-blue-600",
        },
        {
          label: "Churn Rate (30 days)",
          value: `${((stats.churnRate || 0) * 100).toFixed(1)}%`,
          sub: "Monthly churn",
          trend: stats.churnRate ? `${stats.churnRate > 0.05 ? "⚠️" : "✓"}` : "N/A",
          color: "text-amber-600",
        },
        {
          label: "Failed Renewals (Last 7 days)",
          value: stats.failedRenewals || 0,
          sub: "Failed payments",
          trend: stats.failedRenewals ? `+${stats.failedRenewals}` : "None",
          color: stats.failedRenewals ? "text-red-600" : "text-green-600",
        },
      ];

      setCards(cardData);
    } catch (error) {
      console.error("Failed to fetch subscription metrics:", error);
      // Fallback to empty state
      setCards([
        {
          label: "Active Subscriptions",
          value: 0,
          sub: "No data",
          trend: "N/A",
          color: "text-gray-600",
        },
        {
          label: "Monthly Recurring Revenue (MRR)",
          value: "GHS 0",
          sub: "No data",
          trend: "N/A",
          color: "text-gray-600",
        },
        {
          label: "Churn Rate (30 days)",
          value: "0%",
          sub: "No data",
          trend: "N/A",
          color: "text-gray-600",
        },
        {
          label: "Failed Renewals (Last 7 days)",
          value: 0,
          sub: "No data",
          trend: "N/A",
          color: "text-gray-600",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-5 animate-pulse h-20"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-5 flex flex-col gap-1 min-w-[180px]"
        >
          <div className="text-xs font-medium text-gray-500 mb-1">{card.label}</div>
          <div className="text-2xl font-bold text-gray-900 flex items-baseline gap-2">
            <span>{card.value}</span>
            <span className={`text-xs font-semibold ${card.color}`}>{card.trend}</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">{card.sub}</div>
        </div>
      ))}
    </div>
  );
};

export default SubscriptionsSummaryCards;
