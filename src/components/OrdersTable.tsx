import React, { useState, useEffect } from "react";
import adminApiClient from "../services/apiClient";

interface Order {
  id: number;
  User: { name: string };
  Zone: { name: string } | null;
  Rider: { name: string } | null;
  total: number;
  status: string;
}

const OrdersTable: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const allOrders = (await adminApiClient.get('/orders/admin/all')) as any;
      const recentOrders = (allOrders || [])
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 4);
      setOrders(recentOrders);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatOrderId = (id: number): string => {
    return `DW-${String(id).padStart(6, '0')}`;
  };

  return (
    <div className="overflow-x-auto mt-6">
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : (
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="text-gray-500 border-b">
              <th className="py-2 pr-4 font-medium">Order ID</th>
              <th className="py-2 pr-4 font-medium">Customer Name</th>
              <th className="py-2 pr-4 font-medium">Zone</th>
              <th className="py-2 pr-4 font-medium">Rider</th>
              <th className="py-2 pr-4 font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.length > 0 ? (
              orders.map((order) => (
                <tr key={order.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-2 pr-4 font-medium">{formatOrderId(order.id)}</td>
                  <td className="py-2 pr-4">{order.User?.name || "N/A"}</td>
                  <td className="py-2 pr-4">{order.Zone?.name || "Unassigned"}</td>
                  <td className="py-2 pr-4">{order.Rider?.name || "Not assigned"}</td>
                  <td className="py-2 pr-4 font-medium">GH₵ {order.total.toFixed(2)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-500">
                  No orders found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default OrdersTable;
