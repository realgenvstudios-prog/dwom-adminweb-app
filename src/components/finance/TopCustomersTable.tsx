import React, { useState, useEffect } from "react";
import financeService, { type TopCustomer } from "../../services/financeService";

const TopCustomersTable: React.FC = () => {
  const [customers, setCustomers] = useState<TopCustomer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTopCustomers();
  }, []);

  const fetchTopCustomers = async () => {
    try {
      setLoading(true);
      const topCustomers = await financeService.getTopCustomers(6);
      setCustomers(topCustomers);
    } catch (error) {
      console.error("Failed to fetch top customers:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 mb-8 overflow-x-auto">
      <h3 className="text-lg font-semibold mb-4">Top Customers</h3>
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : (
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="text-gray-500 border-b">
              <th className="py-2 pr-4 font-medium">Customer</th>
              <th className="py-2 pr-4 font-medium">Phone</th>
              <th className="py-2 pr-4 font-medium">Total Orders</th>
              <th className="py-2 pr-4 font-medium">Total Spent</th>
              <th className="py-2 pr-4 font-medium">Avg Order Value</th>
              <th className="py-2 pr-4 font-medium">Last Order</th>
            </tr>
          </thead>
          <tbody>
            {customers.length > 0 ? (
              customers.map((c, idx) => (
                <tr key={idx} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-2 pr-4 font-medium">{c.name}</td>
                  <td className="py-2 pr-4">{c.phone}</td>
                  <td className="py-2 pr-4">{c.totalOrders}</td>
                  <td className="py-2 pr-4">GHS {c.totalSpent.toFixed(2)}</td>
                  <td className="py-2 pr-4">GHS {c.avgOrder.toFixed(2)}</td>
                  <td className="py-2 pr-4">{c.lastOrder}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-4 text-center text-gray-500">
                  No customers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default TopCustomersTable;
