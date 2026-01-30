import React, { useState, useEffect } from "react";
import financeService, { type FinanceKPIs } from "../../services/financeService";

interface FinanceKpiRowProps {
  row?: 1 | 2;
}

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes - refresh at reasonable interval

const FinanceKpiRow: React.FC<FinanceKpiRowProps> = ({ row }) => {
  const [kpis, setKpis] = useState<FinanceKPIs | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchKPIs();

    // Set up auto-refresh interval
    const interval = setInterval(() => {
      fetchKPIs();
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  const fetchKPIs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await financeService.getFinanceKPIs();
      setKpis(data);
    } catch (error: any) {
      console.error("Failed to fetch KPIs:", error);
      setError(error?.message || "Failed to load KPIs");
      // Still set default values so cards show up
      setKpis({
        gmv: 0,
        netRevenue: 0,
        grossProfit: 0,
        grossProfitMargin: 22.0,
        avgOrderValue: 0,
        mrr: 0,
        activeSubscriptions: 0,
        failedPaymentRate: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const kpiCards = kpis
    ? [
        { label: "GMV", value: `GHS ${kpis.gmv.toLocaleString()}` },
        { label: "Net Revenue", value: `GHS ${kpis.netRevenue.toLocaleString()}` },
        { label: "Gross Profit Margin", value: `${kpis.grossProfitMargin.toFixed(1)}%` },
        { label: "Avg Order Value", value: `GHS ${kpis.avgOrderValue}` },
        { label: "MRR", value: `GHS ${kpis.mrr.toLocaleString()}` },
        { label: "Active Subs", value: kpis.activeSubscriptions },
        { label: "Failed Payment Rate", value: `${(kpis.failedPaymentRate * 100).toFixed(2)}%` },
      ]
    : [];

  let cardsToShow = kpiCards;
  if (row === 1) cardsToShow = kpiCards.slice(0, 4);
  if (row === 2) cardsToShow = kpiCards.slice(4);

  if (loading && !kpis) {
    return (
      <div className="flex items-center justify-center py-8 col-span-full">
        <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 col-span-full">
        <p className="text-red-700 text-sm">⚠️ {error}</p>
      </div>
    );
  }

  return (
    <>
      {cardsToShow.map((kpi) => (
        <div key={kpi.label} className="bg-white rounded-xl shadow p-6 flex flex-col items-center justify-center h-full">
          <span className="text-lg font-medium mb-2 text-center">{kpi.label}</span>
          <span className="text-2xl font-bold text-center">{kpi.value}</span>
        </div>
      ))}
    </>
  );
};

export default FinanceKpiRow;
