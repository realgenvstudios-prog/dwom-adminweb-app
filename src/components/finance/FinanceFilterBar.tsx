import React from "react";
import FinanceFilters from "./FinanceFilters";

const FinanceFilterBar: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 w-full">
      <FinanceFilters />
      <input
        type="text"
        className="border rounded-lg px-4 py-2 flex-1 min-w-[180px] text-base"
        placeholder="Search by customer, order, or payment..."
      />
    </div>
  );
};

export default FinanceFilterBar;
