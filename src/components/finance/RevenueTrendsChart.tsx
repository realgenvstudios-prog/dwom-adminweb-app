import React, { useState, useEffect } from "react";
import ReactApexChart from "react-apexcharts";
import financeService from "../../services/financeService";

const REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes for trend data

const RevenueTrendsChart: React.FC = () => {
  const [series, setSeries] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRevenueTrends();

    // Set up auto-refresh interval
    const interval = setInterval(() => {
      fetchRevenueTrends();
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  const fetchRevenueTrends = async () => {
    try {
      setLoading(true);
      const trends = await financeService.getRevenueTrends(7);
      
      if (trends && trends.length > 0) {
        setSeries([
          {
            name: "GMV",
            data: trends.map((t) => t.gmv),
          },
          {
            name: "Net Revenue",
            data: trends.map((t) => t.net),
          },
        ]);
        setCategories(trends.map((t) => t.date));
      }
    } catch (error) {
      console.error("Failed to fetch revenue trends:", error);
    } finally {
      setLoading(false);
    }
  };

  const options = {
    chart: { type: "line" as const, height: 250, toolbar: { show: false } },
    xaxis: {
      categories,
      labels: { rotate: -45 },
    },
    stroke: { curve: "smooth" as const },
    colors: ["#4A90E2", "#2EC4B6"],
    legend: { show: true },
    tooltip: { enabled: true },
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 mb-8">
      <h3 className="text-lg font-semibold mb-4">GMV vs Net Revenue</h3>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : (
        <ReactApexChart options={options} series={series} type="line" height={250} />
      )}
    </div>
  );
};

export default RevenueTrendsChart;
