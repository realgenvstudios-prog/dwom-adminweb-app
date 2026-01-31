import React, { useState } from "react";
import FinanceFilters from "./FinanceFilters";

const FinanceFilterBar: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    // Future: Emit search event or pass to parent context
    console.log("Search query:", value);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 w-full">
      <FinanceFilters />
      <div className="relative flex-1 min-w-[180px]">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 w-full text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search by customer, order, or payment..."
        />
        {searchQuery && (
          <button
            onClick={() => handleSearch("")}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default FinanceFilterBar;
