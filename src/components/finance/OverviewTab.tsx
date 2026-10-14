import React from "react";
import FinanceKpiRow from "./FinanceKpiRow";
import RevenueTrendsChart from "./RevenueTrendsChart";
import RevenueByZoneChart from "./RevenueByZoneChart";
import SubscriptionPanel from "./SubscriptionPanel";
import TopCustomersTable from "./TopCustomersTable";
import FailedPaymentsPanel from "./FailedPaymentsPanel";
import FinanceAlertsBox from "./FinanceAlertsBox";
import PnLPanel from "./PnLPanel";

const OverviewTab: React.FC = () => {
  return (
    <>
      {/* KPI Grid */}
      <div className="mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-6">
          <FinanceKpiRow row={1} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          <FinanceKpiRow row={2} />
        </div>
      </div>
      {/* P&L */}
      <PnLPanel />
      {/* Main Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-8">
        <div className="md:col-span-8">
          <div className="bg-white shadow-xs rounded-xl border border-gray-100 p-8 h-full flex flex-col justify-between">
            <RevenueTrendsChart />
          </div>
        </div>
        <div className="md:col-span-4">
          <div className="bg-white shadow-xs rounded-xl border border-gray-100 p-8 h-full flex flex-col justify-between">
            <RevenueByZoneChart />
          </div>
        </div>
      </div>
      {/* Middle Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white shadow-xs rounded-xl border border-gray-100 p-8 h-full flex flex-col justify-between">
          <FailedPaymentsPanel />
        </div>
        <div className="bg-white shadow-xs rounded-xl border border-gray-100 p-8 h-full flex flex-col justify-between">
          <FinanceAlertsBox />
        </div>
      </div>
      {/* Bottom Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white shadow-xs rounded-xl border border-gray-100 p-8 h-full flex flex-col justify-between">
          <SubscriptionPanel />
        </div>
        <div className="bg-white shadow-xs rounded-xl border border-gray-100 p-8 h-full flex flex-col justify-between">
          <TopCustomersTable />
        </div>
      </div>
    </>
  );
};

export default OverviewTab;
