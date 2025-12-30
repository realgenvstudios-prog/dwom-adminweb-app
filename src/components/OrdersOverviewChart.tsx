import React, { useState, useEffect } from "react";
import ReactApexChart from "react-apexcharts";
import dashboardService from "../services/dashboardService";

const OrdersOverviewChart: React.FC = () => {
  const [series, setSeries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOrderTrends();
  }, []);

  const fetchOrderTrends = async () => {
    try {
      setLoading(true);
      const trends = await dashboardService.getRevenueOverTime(7);
      
      if (trends && trends.length > 0) {
        const orderCounts = trends.map((t) => t.orders);
        const revenues = trends.map((t) => parseFloat(t.revenue.toFixed(2)));
        
        setSeries([
          {
            name: "Orders",
            data: orderCounts,
          },
          {
            name: "Revenue (GH₵)",
            data: revenues,
          },
        ]);
      }
    } catch (error) {
      console.error("Failed to fetch order trends:", error);
      // Fallback to empty data
      setSeries([
        { name: "Orders", data: [0, 0, 0, 0, 0, 0, 0] },
        { name: "Revenue (GH₵)", data: [0, 0, 0, 0, 0, 0, 0] },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const options = {
    chart: {
      type: "bar" as const,
      height: 120,
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "60%",
        borderRadius: 6,
      },
    },
    dataLabels: { enabled: false },
    legend: { show: false },
    xaxis: {
      categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      labels: { show: false },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { show: false },
    grid: { show: false },
    colors: ["#E5D85C", "#2EC4B6"],
    tooltip: { enabled: true },
  };

  return (
    <div className="w-full">
      {loading ? (
        <div className="flex items-center justify-center h-12">
          <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : (
        <ReactApexChart options={options} series={series} type="bar" height={40} />
      )}
    </div>
  );
};

export default OrdersOverviewChart;
