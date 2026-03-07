import React, { useState, useEffect, useRef } from "react";
import apiClient from "../services/apiClient";

interface Customer {
  id: number;
  name: string;
  email: string | null;
  phone: string;
  role: string;
  createdAt: string;
  address: string | null;
  totalOrders: number;
  totalSpend: number;
  avgOrder: number;
  lastOrder: string | null;
  status: 'Active' | 'At Risk' | 'Churned' | 'New';
}

interface OrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  image: string | null;
}

interface CustomerOrder {
  id: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  total: number;
  createdAt: string;
  address: string | null;
  items: OrderItem[];
}

const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [orderHistory, setOrderHistory] = useState<CustomerOrder[]>([]);
  const [orderHistoryLoading, setOrderHistoryLoading] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [detailTab, setDetailTab] = useState<'info' | 'orders'>('info');
  const isFetchingRef = useRef(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchOrderHistory = async (customerId: number) => {
    try {
      setOrderHistoryLoading(true);
      const data = await apiClient.get<CustomerOrder[]>(`/users/admin/customers/${customerId}/orders`);
      setOrderHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch order history:', err);
      setOrderHistory([]);
    } finally {
      setOrderHistoryLoading(false);
    }
  };

  const fetchCustomers = async () => {
    if (isFetchingRef.current) return;
    
    try {
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);
      
      console.log('📊 [CustomersPage] Fetching customers with stats...');
      
      const data = await apiClient.get<any[]>('/users/admin/customers');
      console.log('📊 [CustomersPage] Response:', data);
      
      if (!Array.isArray(data)) {
        console.error('❌ [CustomersPage] Expected array, got:', typeof data);
        setError('Invalid response from server');
        setCustomers([]);
        return;
      }

      const mappedCustomers: Customer[] = data.map(user => ({
        id: user.id,
        name: user.name || 'Unknown',
        email: user.email || null,
        phone: user.phone || user.phoneNumber || 'N/A',
        role: user.role,
        createdAt: user.createdAt,
        address: user.address || null,
        totalOrders: user.totalOrders || 0,
        totalSpend: user.totalSpend || 0,
        avgOrder: user.avgOrder || 0,
        lastOrder: user.lastOrder || null,
        status: user.status || 'New',
      }));

      console.log(`✅ [CustomersPage] Fetched ${mappedCustomers.length} customers`);
      setCustomers(mappedCustomers);
    } catch (err: any) {
      console.error('❌ [CustomersPage] Error:', err);
      setError(err.message || 'Failed to fetch customers');
      setCustomers([]);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const statusColors: Record<string, string> = {
    "Active": "bg-green-100 text-green-700",
    "At Risk": "bg-yellow-100 text-yellow-700",
    "Churned": "bg-red-100 text-red-700",
    "New": "bg-blue-100 text-blue-700"
  };

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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="text-sm font-medium text-gray-500">Total Customers</div>
            <div className="text-3xl font-bold text-gray-900 mt-1">{totalCustomers}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="text-sm font-medium text-gray-500">New Customers</div>
            <div className="text-3xl font-bold text-blue-600 mt-1">{newCustomers}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="text-sm font-medium text-gray-500">Active Customers</div>
            <div className="text-3xl font-bold text-green-600 mt-1">{activeCustomers}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="text-sm font-medium text-gray-500">Total Revenue</div>
            <div className="text-3xl font-bold text-gray-900 mt-1">GHS {totalRevenue.toLocaleString()}</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Search by name, email, phone, or ID..."
              className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="flex gap-2 flex-wrap">
              {["All", "New", "Active", "At Risk", "Churned"].map((status) => (
                <button
                  key={status}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    selectedStatus === status
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => setSelectedStatus(status)}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

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
                {filtered.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="text-gray-400 text-5xl mb-4">👥</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No customers found</h3>
                    <p className="text-gray-500 text-sm">
                      {customers.length === 0 
                        ? "Customers will appear here as they sign up" 
                        : "Try adjusting your search or filters"}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="px-4 py-3 font-medium text-gray-600">Customer</th>
                          <th className="px-4 py-3 font-medium text-gray-600">Contact</th>
                          <th className="px-4 py-3 font-medium text-gray-600">Orders</th>
                          <th className="px-4 py-3 font-medium text-gray-600">Joined</th>
                          <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filtered.map((customer) => (
                          <tr
                            key={customer.id}
                            className={`hover:bg-blue-50 cursor-pointer transition ${
                              selectedCustomer?.id === customer.id ? 'bg-blue-50' : ''
                            }`}
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setDetailTab('info');
                              setExpandedOrderId(null);
                              setOrderHistory([]);
                              fetchOrderHistory(customer.id);
                            }}
                          >
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                                  {customer.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">{customer.name}</div>
                                  <div className="text-xs text-gray-500">ID: {customer.id}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-gray-900">{customer.phone}</div>
                              <div className="text-xs text-gray-500">{customer.email || 'No email'}</div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="font-medium text-gray-900">{customer.totalOrders}</div>
                              <div className="text-xs text-gray-500">GHS {customer.totalSpend}</div>
                            </td>
                            <td className="px-4 py-4 text-gray-600">
                              {formatDate(customer.createdAt)}
                            </td>
                            <td className="px-4 py-4">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[customer.status]}`}>
                                {customer.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Details Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 sticky top-6 overflow-hidden">

                {selectedCustomer ? (
                  <>
                    {/* Profile Header */}
                    <div className="p-6 pb-4 border-b border-gray-100">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
                          {selectedCustomer.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-lg font-bold text-gray-900 truncate">{selectedCustomer.name}</h4>
                          <p className="text-sm text-gray-500 truncate">{selectedCustomer.phone}</p>
                          <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[selectedCustomer.status]}`}>
                            {selectedCustomer.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-100">
                      <button
                        onClick={() => setDetailTab('info')}
                        className={`flex-1 py-3 text-sm font-medium transition ${detailTab === 'info' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        Info & Stats
                      </button>
                      <button
                        onClick={() => setDetailTab('orders')}
                        className={`flex-1 py-3 text-sm font-medium transition ${detailTab === 'orders' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        Order History {selectedCustomer.totalOrders > 0 && <span className="ml-1 bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">{selectedCustomer.totalOrders}</span>}
                      </button>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6 max-h-[60vh] overflow-y-auto">
                      {detailTab === 'info' && (
                        <div className="space-y-5">
                          {/* Contact Info */}
                          <div className="space-y-2">
                            <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Contact</h5>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2.5 text-sm">
                                <span className="text-gray-400">📧</span>
                                <span className="text-gray-800">{selectedCustomer.email || 'No email'}</span>
                              </div>
                              <div className="flex items-center gap-2.5 text-sm">
                                <span className="text-gray-400">🆔</span>
                                <span className="text-gray-800">Customer #{selectedCustomer.id}</span>
                              </div>
                              <div className="flex items-start gap-2.5 text-sm">
                                <span className="text-gray-400 mt-0.5">📍</span>
                                <span className="text-gray-800">{selectedCustomer.address || 'No address saved'}</span>
                              </div>
                              <div className="flex items-center gap-2.5 text-sm">
                                <span className="text-gray-400">📅</span>
                                <span className="text-gray-800">Joined {formatDate(selectedCustomer.createdAt)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="space-y-2">
                            <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Statistics</h5>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="bg-gray-50 rounded-lg p-3 text-center">
                                <div className="text-2xl font-bold text-gray-900">{selectedCustomer.totalOrders}</div>
                                <div className="text-xs text-gray-500">Orders</div>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-3 text-center">
                                <div className="text-lg font-bold text-gray-900">GHS {selectedCustomer.totalSpend.toFixed(2)}</div>
                                <div className="text-xs text-gray-500">Total Spent</div>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-3 text-center">
                                <div className="text-lg font-bold text-gray-900">GHS {selectedCustomer.avgOrder.toFixed(2)}</div>
                                <div className="text-xs text-gray-500">Avg Order</div>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-3 text-center">
                                <div className="text-sm font-medium text-gray-900">{selectedCustomer.lastOrder ? formatDate(selectedCustomer.lastOrder) : '—'}</div>
                                <div className="text-xs text-gray-500">Last Order</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {detailTab === 'orders' && (
                        <div className="space-y-3">
                          {orderHistoryLoading ? (
                            <div className="flex items-center justify-center py-10">
                              <svg className="animate-spin h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                            </div>
                          ) : orderHistory.length === 0 ? (
                            <div className="text-center py-10">
                              <div className="text-4xl mb-2">🛒</div>
                              <p className="text-gray-500 text-sm">No orders yet</p>
                            </div>
                          ) : (
                            orderHistory.map(order => (
                              <div key={order.id} className="border border-gray-200 rounded-lg overflow-hidden">
                                {/* Order Header - always visible */}
                                <button
                                  className="w-full text-left p-3 hover:bg-gray-50 transition"
                                  onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-semibold text-gray-900 text-sm">Order #{order.id}</span>
                                    <span className="text-sm font-bold text-gray-900">GHS {order.total.toFixed(2)}</span>
                                  </div>
                                  <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span>{formatDate(order.createdAt)}</span>
                                    <div className="flex gap-1.5">
                                      <span className={`px-1.5 py-0.5 rounded-full font-medium ${
                                        order.paymentStatus === 'completed' || order.paymentStatus === 'paid'
                                          ? 'bg-green-100 text-green-700'
                                          : order.paymentStatus === 'pending'
                                          ? 'bg-yellow-100 text-yellow-700'
                                          : 'bg-red-100 text-red-700'
                                      }`}>{order.paymentStatus}</span>
                                      <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium capitalize">{order.status}</span>
                                    </div>
                                  </div>
                                </button>

                                {/* Expanded Order Details */}
                                {expandedOrderId === order.id && (
                                  <div className="border-t border-gray-100 bg-gray-50 p-3 space-y-3">
                                    {/* Items */}
                                    <div>
                                      <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Items</p>
                                      <div className="space-y-1.5">
                                        {order.items.map((item, idx) => (
                                          <div key={idx} className="flex justify-between items-start text-xs">
                                            <div className="text-gray-800">
                                              <span className="font-medium">{item.name}</span>
                                              <span className="text-gray-500 ml-1">× {item.quantity}</span>
                                            </div>
                                            <span className="text-gray-700 font-medium ml-2 shrink-0">GHS {item.total.toFixed(2)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Breakdown */}
                                    <div className="border-t border-gray-200 pt-2 space-y-1 text-xs">
                                      <div className="flex justify-between text-gray-500">
                                        <span>Subtotal</span><span>GHS {order.subtotal.toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between text-gray-500">
                                        <span>Delivery</span><span>GHS {order.deliveryFee.toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between text-gray-500">
                                        <span>Service fee</span><span>GHS {order.serviceFee.toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between font-semibold text-gray-900 border-t border-gray-200 pt-1">
                                        <span>Total</span><span>GHS {order.total.toFixed(2)}</span>
                                      </div>
                                    </div>

                                    {/* Payment & Address */}
                                    <div className="border-t border-gray-200 pt-2 space-y-1 text-xs text-gray-600">
                                      <div className="flex gap-1.5 items-center">
                                        <span>💳</span>
                                        <span className="capitalize">{order.paymentMethod || 'N/A'}</span>
                                      </div>
                                      {order.address && (
                                        <div className="flex gap-1.5 items-start">
                                          <span className="mt-0.5">📍</span>
                                          <span>{order.address}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="p-6 text-center py-16">
                    <div className="text-gray-300 text-5xl mb-4">👤</div>
                    <p className="text-gray-500 text-sm">Select a customer to view their details</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomersPage;
