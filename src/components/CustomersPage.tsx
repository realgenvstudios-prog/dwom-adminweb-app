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

const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    if (isFetchingRef.current) return;
    
    try {
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);
      
      console.log('📊 [CustomersPage] Fetching customers...');
      
      // Fetch users directly - apiClient returns data directly, not { data: ... }
      const users = await apiClient.get<any[]>('/users');
      console.log('📊 [CustomersPage] Users response:', users);
      
      if (!Array.isArray(users)) {
        console.error('❌ [CustomersPage] Expected array, got:', typeof users);
        setError('Invalid response from server');
        setCustomers([]);
        return;
      }

      // Filter out admin users - only show customers
      const customerUsers = users.filter(u => u.role === 'user');
      
      // Map to customer format with computed fields
      const mappedCustomers: Customer[] = customerUsers.map(user => ({
        id: user.id,
        name: user.name || 'Unknown',
        email: user.email || null,
        phone: user.phone || user.phoneNumber || 'N/A',
        role: user.role,
        createdAt: user.createdAt,
        address: user.address || null,
        totalOrders: 0, // Will be updated if we fetch orders
        totalSpend: 0,
        avgOrder: 0,
        lastOrder: null,
        status: 'New' as const, // New users with no orders
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
                            onClick={() => setSelectedCustomer(customer)}
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
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Details</h3>
                
                {selectedCustomer ? (
                  <div className="space-y-6">
                    {/* Profile Header */}
                    <div className="text-center pb-4 border-b border-gray-100">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
                        {selectedCustomer.name.charAt(0).toUpperCase()}
                      </div>
                      <h4 className="text-xl font-bold text-gray-900">{selectedCustomer.name}</h4>
                      <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${statusColors[selectedCustomer.status]}`}>
                        {selectedCustomer.status}
                      </span>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-3">
                      <h5 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Contact Information</h5>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-gray-400">📧</span>
                          <span className="text-gray-900">{selectedCustomer.email || 'No email provided'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-gray-400">📱</span>
                          <span className="text-gray-900">{selectedCustomer.phone}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-gray-400">🆔</span>
                          <span className="text-gray-900">Customer #{selectedCustomer.id}</span>
                        </div>
                        <div className="flex items-start gap-3 text-sm">
                          <span className="text-gray-400 mt-0.5">📍</span>
                          <span className="text-gray-900">{selectedCustomer.address || 'No address saved'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="space-y-3">
                      <h5 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Statistics</h5>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold text-gray-900">{selectedCustomer.totalOrders}</div>
                          <div className="text-xs text-gray-500">Total Orders</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold text-gray-900">GHS {selectedCustomer.totalSpend}</div>
                          <div className="text-xs text-gray-500">Total Spend</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold text-gray-900">GHS {selectedCustomer.avgOrder}</div>
                          <div className="text-xs text-gray-500">Avg Order</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                          <div className="text-sm font-medium text-gray-900">{formatDate(selectedCustomer.createdAt)}</div>
                          <div className="text-xs text-gray-500">Joined</div>
                        </div>
                      </div>
                    </div>

                    {/* Last Order */}
                    <div className="space-y-3">
                      <h5 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Last Order</h5>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-sm text-gray-900">
                          {selectedCustomer.lastOrder ? formatDate(selectedCustomer.lastOrder) : 'No orders yet'}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-300 text-5xl mb-4">👤</div>
                    <p className="text-gray-500 text-sm">Select a customer from the list to view their details</p>
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
