import React, { useState, useEffect } from "react";
import ReactApexChart from "react-apexcharts";
import financeService from "../../services/financeService";

const RevenueByZoneChart: React.FC = () => {
  const [series, setSeries] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRevenueByZone();
  }, []);

  const fetchRevenueByZone = async () => {
    try {
      setLoading(true);
      const zones = await financeService.getRevenueByZone();
      
      if (zones && zones.length > 0) {
        setSeries([
          {
            name: "Revenue",
            data: zones.map((z) => z.revenue),
          },
        ]);
        setCategories(zones.map((z) => z.zone));
      }
    } catch (error) {
      console.error("Failed to fetch revenue by zone:", error);
    } finally {
      setLoading(false);
    }
  };

  const options = {
    chart: { type: "bar" as const, height: 200, toolbar: { show: false } },
    xaxis: {
      categories,
      labels: { rotate: -45 },
    },
    colors: ["#E5D85C"],
    legend: { show: false },
    tooltip: { enabled: true },
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 mb-8">
      <h3 className="text-lg font-semibold mb-4">Revenue by Zone</h3>
      {loading ? (
        <div className="flex items-center justify-center h-56">
          <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : (
        <ReactApexChart options={options} series={series} type="bar" height={200} />
      )}
    </div>
  );
};

export default RevenueByZoneChart;
