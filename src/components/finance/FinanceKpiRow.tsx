import React, { useState, useEffect } from "react";
import financeService, { type FinanceKPIs } from "../../services/financeService";

interface FinanceKpiRowProps {
  row?: 1 | 2;
}

const FinanceKpiRow: React.FC<FinanceKpiRowProps> = ({ row }) => {
  const [kpis, setKpis] = useState<FinanceKPIs | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchKPIs();
  }, []);

  const fetchKPIs = async () => {
    try {
      setLoading(true);
      const data = await financeService.getFinanceKPIs();
      setKpis(data);
    } catch (error) {
      console.error("Failed to fetch KPIs:", error);
    } finally {
      setLoading(false);
    }
  };

  const kpiCards = kpis
    ? [
        { label: "GMV", value: `GHS ${kpis.gmv.toLocaleString()}` },
        { label: "Net Revenue", value: `GHS ${kpis.netRevenue.toLocaleString()}` },
        { label: "Gross Profit", value: `${(kpis.grossProfit * 100).toFixed(1)}%` },
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
