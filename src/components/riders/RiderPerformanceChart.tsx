import React from "react";

// Simple bar chart for mock data
const RiderPerformanceChart: React.FC<{ data: { day: string; deliveries: number }[] }> = ({ data }) => (
  <div className="bg-white rounded-xl shadow p-6 mb-6">
    <h3 className="text-lg font-semibold mb-4">Rider Performance (7 days)</h3>
    <div className="flex items-end gap-2 h-32">
      {data.map((d) => (
        <div key={d.day} className="flex flex-col items-center justify-end h-full">
          <div className="w-8 bg-blue-500 rounded-t" style={{ height: `${d.deliveries * 4}px` }}></div>
          <span className="text-xs text-gray-500 mt-1">{d.day}</span>
        </div>
      ))}
    </div>
  </div>
);

export default RiderPerformanceChart;
