import React, { useState, useEffect } from "react";
import ordersService from "../../services/ordersService";

interface Kpi {
  label: string;
  value: string | number;
  color: string;
}

const OrdersKpiCards: React.FC = () => {
  const [kpis, setKpis] = useState<Kpi[]>([
    { label: "Total Orders Today", value: "—", color: "text-blue-600" },
    { label: "Completed Orders", value: "—", color: "text-green-600" },
    { label: "Failed / Canceled", value: "—", color: "text-red-600" },
    { label: "Revenue Today (GHS)", value: "—", color: "text-amber-600" },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        console.log('📊 [OrdersKpiCards] Fetching stats from backend');
        const stats = await ordersService.getStats();
        console.log('✅ [OrdersKpiCards] Stats loaded:', stats);

        setKpis([
          { label: "Total Orders Today", value: stats.totalOrdersToday || 0, color: "text-blue-600" },
          { label: "Completed Orders", value: stats.completedOrders || 0, color: "text-green-600" },
          { label: "Failed / Canceled", value: stats.canceledOrders || 0, color: "text-red-600" },
          {
            label: "Revenue Today (GHS)",
            value: stats.revenueToday ? `${stats.revenueToday.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "0.00",
            color: "text-amber-600",
          },
        ]);
      } catch (error) {
        console.error('❌ [OrdersKpiCards] Failed to fetch stats:', error);
        // Keep loading state showing dashes
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className="bg-white rounded-lg border border-gray-100 shadow-sm px-4 py-3 flex flex-col gap-1 min-w-[120px]"
        >
          <div className="text-xs font-medium text-gray-500 mb-1">{kpi.label}</div>
          <div className={`text-xl font-bold ${kpi.color} ${loading && kpi.value === "—" ? "animate-pulse" : ""}`}>
            {kpi.value}
          </div>
        </div>
      ))}
    </div>
  );
};

export default OrdersKpiCards;
