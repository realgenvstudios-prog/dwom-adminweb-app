import React, { useState, useEffect, useCallback } from "react";
import ReactApexChart from "react-apexcharts";
import financeService from "../../services/financeService";
import { logger } from '../../utils/logger';

type Period = "daily" | "weekly" | "monthly";

const PnLPanel: React.FC = () => {
  const [period, setPeriod] = useState<Period>("daily");
  const [series, setSeries] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPnL = useCallback(async (p: Period) => {
    try {
      setLoading(true);
      setError(null);
      const buckets = await financeService.getPeriodPnL(p);
      if (buckets && buckets.length > 0) {
        setSeries([
          { name: "Contribution", data: buckets.map((b) => b.contribution) },
          { name: "Opex", data: buckets.map((b) => -b.opex) },
          { name: "Operating Result", data: buckets.map((b) => b.operatingResult) },
        ]);
        setCategories(buckets.map((b) => b.period));
      } else {
        setSeries([]);
        setError("No P&L data for this period yet");
      }
    } catch (err) {
      logger.error("Failed to fetch P&L:", err);
      setError("Failed to load P&L data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPnL(period);
  }, [period, fetchPnL]);

  const options = {
    chart: { type: "bar" as const, height: 280, toolbar: { show: false }, stacked: false },
    xaxis: { categories, labels: { rotate: -45 } },
    colors: ["#2EC4B6", "#E07A5F", "#4A90E2"],
    legend: { show: true },
    tooltip: { enabled: true },
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Profit &amp; Loss</h3>
        <div className="flex gap-2">
          {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`text-sm px-3 py-1 rounded-full border ${
                period === p ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200"
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-gray-400 mb-4">
        Contribution = revenue − cost of goods sold. Operating result nets opex against contribution.
        Excludes founder capital contributions and reimbursements.
      </p>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">⚠️ {error}</div>
      )}
      {loading && !series.length ? (
        <div className="flex items-center justify-center h-64">
          <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : (
        <ReactApexChart options={options} series={series} type="bar" height={280} />
      )}
    </div>
  );
};

export default PnLPanel;
