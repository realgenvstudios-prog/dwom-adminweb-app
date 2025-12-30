import React from "react";

const FinanceFilters: React.FC = () => {
  return (
    <div className="flex flex-wrap gap-4 items-center">
      <select className="border rounded-lg px-4 py-2 min-w-[150px]">
        <option>Today</option>
        <option>Last 7 days</option>
        <option>Last 30 days</option>
        <option>Custom</option>
      </select>
      <select className="border rounded-lg px-4 py-2 min-w-[150px]">
        <option>All Zones</option>
        <option>Accra Central</option>
        <option>East Legon</option>
        <option>Osu</option>
        <option>Airport</option>
        <option>Tema</option>
      </select>
    </div>
  );
};

export default FinanceFilters;
