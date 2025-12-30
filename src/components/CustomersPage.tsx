import React, { useState, useEffect } from "react";
import customersService, { type Customer, type CustomerSegment, type CustomerChurnMetrics, type CustomerMetrics } from "../services/customersService";

const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [metrics, setMetrics] = useState<CustomerMetrics | null>(null);
  const [segments, setSegments] = useState<CustomerSegment[]>([]);
  const [churnMetrics, setChurnMetrics] = useState<CustomerChurnMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedZone, setSelectedZone] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const statusColors = {
    "Active": "bg-green-100 text-green-700",
    "At Risk": "bg-yellow-100 text-yellow-700",
    "Churned": "bg-red-100 text-red-700",
    "New": "bg-blue-100 text-blue-700"
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel
      const [customersData, metricsData, segmentsData, churnData] = await Promise.all([
        customersService.getAllCustomers(),
        customersService.getCustomerMetrics(),
        customersService.getCustomerSegments(),
        customersService.getChurnMetrics(),
      ]);

      setCustomers(customersData);
      setMetrics(metricsData);
      setSegments(segmentsData);
      setChurnMetrics(churnData);
    } catch (error) {
      console.error("Failed to fetch customer data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = customers.filter(c =>
    (selectedStatus === "All" || c.status === selectedStatus) &&
    (selectedZone === "all" || c.zone?.toLowerCase() === selectedZone.toLowerCase()) &&
    (c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.id.toString() === search)
  );

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4">
      <div className="max-w-screen-2xl mx-auto">
        {/* Top Bar */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-5 mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
            <div className="text-sm text-gray-500">Customer insights & profiles</div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 w-full sm:w-auto">
            <select className="border rounded-lg px-4 py-2 min-w-[140px] text-base">
              <option>Today</option>
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>All time</option>
            </select>
            <select className="border rounded-lg px-4 py-2 min-w-[140px] text-base" value={selectedZone} onChange={e => setSelectedZone(e.target.value)}>
              <option value="all">All Zones</option>
              <option value="accra">Accra Central</option>
              <option value="east-legon">East Legon</option>
              <option value="osu">Osu</option>
              <option value="airport">Airport</option>
              <option value="tema">Tema</option>
            </select>
            <input
              className="border rounded-lg px-4 py-2 min-w-[200px] flex-1 text-base"
              placeholder="Search by customer name, phone, or ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 flex items-center justify-center">
            <div className="text-center">
              <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-600">Loading customers...</p>
            </div>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            {metrics && (
              <div className="mb-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center text-center">
                    <span className="text-sm font-medium text-gray-600 mb-2">Total Customers</span>
                    <span className="text-2xl font-bold text-gray-900">{metrics.totalCustomers}</span>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center text-center">
                    <span className="text-sm font-medium text-gray-600 mb-2">Total Revenue</span>
                    <span className="text-2xl font-bold text-gray-900">GHS {metrics.totalRevenue.toLocaleString()}</span>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center text-center">
                    <span className="text-sm font-medium text-gray-600 mb-2">Avg Order Value</span>
                    <span className="text-2xl font-bold text-gray-900">GHS {metrics.avgOrderValue}</span>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center text-center">
                    <span className="text-sm font-medium text-gray-600 mb-2">Repurchase Rate</span>
                    <span className="text-2xl font-bold text-gray-900">{metrics.repurchaseRate.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            )}
            
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Table */}
          <div className="lg:col-span-8">
            <div className="mb-4 flex gap-2">
              {["All", "Active", "At Risk", "Churned"].map((status) => (
                <button
                  key={status}
                  className={`px-4 py-1 rounded-full text-sm font-medium border ${selectedStatus === status ? "bg-blue-600 text-white border-blue-600" : "bg-gray-100 text-gray-700 border-transparent"}`}
                  onClick={() => setSelectedStatus(status)}
                >
                  {status}
                </button>
              ))}
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="text-gray-500 border-b">
                    <th className="py-2 pr-4 font-medium">Name</th>
                    <th className="py-2 pr-4 font-medium">Phone</th>
                    <th className="py-2 pr-4 font-medium">Zone</th>
                    <th className="py-2 pr-4 font-medium">Total Orders</th>
                    <th className="py-2 pr-4 font-medium">Total Spend</th>
                    <th className="py-2 pr-4 font-medium">Avg Order Value</th>
                    <th className="py-2 pr-4 font-medium">Last Order</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b last:border-0 cursor-pointer hover:bg-blue-50 transition"
                      onClick={() => setSelectedCustomer(c)}
                    >
                      <td className="py-2 pr-4 font-medium">{c.name}</td>
                      <td className="py-2 pr-4">{c.phone}</td>
                      <td className="py-2 pr-4">{c.zone}</td>
                      <td className="py-2 pr-4">{c.totalOrders}</td>
                      <td className="py-2 pr-4">GHS {c.totalSpend}</td>
                      <td className="py-2 pr-4">GHS {c.avgOrder}</td>
                      <td className="py-2 pr-4">{c.lastOrder}</td>
                      <td className="py-2 pr-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[c.status as keyof typeof statusColors]}`}>{c.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* Right: Insights & Profile */}
          <div className="lg:col-span-4 flex flex-col gap-8">
            {/* Customer Segments */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold mb-4">Customer Segments</h3>
              <div className="space-y-3">
                {segments.map(seg => (
                  <div key={seg.label} className="flex items-center gap-3">
                    <div className="w-28 text-sm text-gray-700">{seg.label}</div>
                    <div className="flex-1 bg-gray-100 rounded h-3 overflow-hidden">
                      <div className={`${seg.color} h-3 rounded`} style={{ width: `${seg.value > 0 ? Math.min((seg.value / (segments.reduce((sum, s) => sum + s.value, 0) || 1)) * 100, 100) : 0}%` }}></div>
                    </div>
                    <div className="w-8 text-right text-sm font-medium text-gray-700">{seg.value}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Churn Risk */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold mb-4">Churn Risk</h3>
              <div className="flex gap-4 mb-4">
                <div className="flex flex-col items-center flex-1">
                  <span className="text-xl font-bold text-yellow-600">{churnMetrics?.atRisk || 0}</span>
                  <span className="text-xs text-gray-500">At Risk</span>
                </div>
                <div className="flex flex-col items-center flex-1">
                  <span className="text-xl font-bold text-red-600">{churnMetrics?.churnedLast30Days || 0}</span>
                  <span className="text-xs text-gray-500">Churned (30d)</span>
                </div>
                <div className="flex flex-col items-center flex-1">
                  <span className="text-xl font-bold text-green-600">{churnMetrics?.recovered || 0}</span>
                  <span className="text-xs text-gray-500">Recovered</span>
                </div>
              </div>
              <div className="space-y-2">
                {churnMetrics?.churnList.map((c, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span>{c.name}</span>
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">{c.days} days since last order</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Selected Customer Profile */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold mb-4">Customer Details</h3>
              {selectedCustomer ? (
                <div className="space-y-2">
                  <div className="font-bold text-lg">{selectedCustomer.name}</div>
                  <div className="text-sm text-gray-500">{selectedCustomer.phone} &bull; {selectedCustomer.zone}</div>
                  <div className="text-sm text-gray-500">Joined: {selectedCustomer.joined}</div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs">Total Orders: {selectedCustomer.totalOrders}</span>
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs">Total Spend: GHS {selectedCustomer.totalSpend}</span>
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs">Avg Order: GHS {selectedCustomer.avgOrder}</span>
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs">Payment: {selectedCustomer.payment}</span>
                  </div>
                </div>
              ) : (
                <div className="text-gray-400 text-sm">Select a customer from the table to view details.</div>
              )}
            </div>
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CustomersPage;
