import React, { useState } from "react";
import { useCustomersData } from "./customers/useCustomersData";
import { useCustomerSelection } from "./customers/useCustomerSelection";
import CustomersStatsCards from "./customers/CustomersStatsCards";
import CustomersFilterBar from "./customers/CustomersFilterBar";
import CustomersTable from "./customers/CustomersTable";
import CustomerDetailSidebar from "./customers/CustomerDetailSidebar";

const CustomersPage: React.FC = () => {
  const { customers, loading, error, fetchCustomers } = useCustomersData();
  const {
    selectedCustomer,
    orderHistory,
    orderHistoryLoading,
    expandedOrderId,
    setExpandedOrderId,
    detailTab,
    setDetailTab,
    selectCustomer,
  } = useCustomerSelection();

  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");

  const filtered = customers.filter(c =>
    (selectedStatus === "All" || c.status === selectedStatus) &&
    (c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toString() === search)
  );

  // Calculate metrics
  const totalCustomers = customers.length;
  const newCustomers = customers.filter(c => c.status === 'New').length;
  const activeCustomers = customers.filter(c => c.status === 'Active').length;
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpend, 0);

  return (
    <div className="bg-gray-50 min-h-screen py-8 px-4">
      <div className="max-w-screen-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500 mt-1">Manage and view all registered customers</p>
        </div>

        <CustomersStatsCards
          totalCustomers={totalCustomers}
          newCustomers={newCustomers}
          activeCustomers={activeCustomers}
          totalRevenue={totalRevenue}
        />

        <CustomersFilterBar
          search={search}
          setSearch={setSearch}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
        />

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 text-red-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">Error: {error}</span>
            </div>
            <button
              onClick={fetchCustomers}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <svg className="animate-spin h-10 w-10 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-gray-600">Loading customers...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Customer Table */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <CustomersTable
                  filtered={filtered}
                  totalCustomers={customers.length}
                  selectedCustomerId={selectedCustomer?.id}
                  onSelectCustomer={selectCustomer}
                />
              </div>
            </div>

            {/* Customer Details Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 sticky top-6 overflow-hidden">
                <CustomerDetailSidebar
                  selectedCustomer={selectedCustomer}
                  detailTab={detailTab}
                  setDetailTab={setDetailTab}
                  orderHistory={orderHistory}
                  orderHistoryLoading={orderHistoryLoading}
                  expandedOrderId={expandedOrderId}
                  setExpandedOrderId={setExpandedOrderId}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomersPage;
