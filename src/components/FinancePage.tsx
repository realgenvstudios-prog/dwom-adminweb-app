import React from "react";
import FinanceFilterBar from "./finance/FinanceFilterBar";
import FinanceKpiRow from "./finance/FinanceKpiRow";
import RevenueTrendsChart from "./finance/RevenueTrendsChart";
import RevenueByZoneChart from "./finance/RevenueByZoneChart";
import SubscriptionPanel from "./finance/SubscriptionPanel";
import TopCustomersTable from "./finance/TopCustomersTable";
import FailedPaymentsPanel from "./finance/FailedPaymentsPanel";
import FinanceAlertsBox from "./finance/FinanceAlertsBox";

const FinancePage: React.FC = () => {
  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4">
      <div className="max-w-screen-2xl mx-auto">
        {/* Filters Section */}
        <div className="mb-8">
          <FinanceFilterBar />
        </div>
        {/* KPI Grid */}
        <div className="mb-8">
          {/* First row: 4 KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-6">
            <FinanceKpiRow row={1} />
          </div>
          {/* Second row: remaining KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            <FinanceKpiRow row={2} />
          </div>
        </div>
        {/* Main Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-8">
          <div className="md:col-span-8">
            <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-8 h-full flex flex-col justify-between">
              <RevenueTrendsChart />
            </div>
          </div>
          <div className="md:col-span-4">
            <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-8 h-full flex flex-col justify-between">
              <RevenueByZoneChart />
            </div>
          </div>
        </div>
        {/* Middle Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-8 h-full flex flex-col justify-between">
            <FailedPaymentsPanel />
          </div>
          <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-8 h-full flex flex-col justify-between">
            <FinanceAlertsBox />
          </div>
        </div>
        {/* Bottom Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-8 h-full flex flex-col justify-between">
            <SubscriptionPanel />
          </div>
          <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-8 h-full flex flex-col justify-between">
            <TopCustomersTable />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancePage;
