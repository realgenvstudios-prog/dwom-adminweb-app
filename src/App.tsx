



import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import OrdersPage from './components/OrdersPage';
import SubscriptionsPage from './components/SubscriptionsPage';
import OrdersOverviewChart from './components/OrdersOverviewChart';
import OrdersTable from './components/OrdersTable';
import PopularItems from './components/PopularItems';
import RidersActivity from './components/RidersActivity';
import InventoryAlerts from './components/InventoryAlerts';
import QuickActions from './components/QuickActions';
import WarehouseOperationsPage from './components/WarehouseOperationsPage';
import ProductsPage from './components/ProductsPage';
import CategoriesPage from './components/CategoriesPage';
import BundlesPage from './components/BundlesPage';
import RidersPage from './components/riders/RidersPage';
import FinancePage from './components/FinancePage';
import MarketingPage from './components/MarketingPage';
import CustomersPage from './components/CustomersPage';
import AdminsPage from './components/AdminsPage';
import SupportPage from './components/SupportPage';
import SettingsPage from './components/SettingsPage';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import adminAuthService from './services/authService';
import dashboardService, { type DashboardData } from './services/dashboardService';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  // Dashboard state
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  // Fetch dashboard data when component mounts
  useEffect(() => {
    if (location.pathname === '/') {
      fetchDashboardData();
    }
  }, [location.pathname]);

  const fetchDashboardData = async () => {
    try {
      setDashboardLoading(true);
      setDashboardError(null);
      console.log('📊 Fetching dashboard data...');
      const data = await dashboardService.getDashboardData();
      setDashboardData(data);
      console.log('✅ Dashboard data loaded:', data);
    } catch (error: any) {
      console.error('❌ Failed to load dashboard data:', error);
      setDashboardError(error.message || 'Failed to load dashboard data');
    } finally {
      setDashboardLoading(false);
    }
  };

  // Hide sidebar on login page
  const showSidebar = location.pathname !== '/login';

  return (
    <div className="relative min-h-screen bg-gray-50">
      {/* Show sidebar only on protected pages */}
      {showSidebar && (
        <aside className={`fixed top-0 left-0 h-full z-30 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-16'} bg-[#1A2233] text-white flex flex-col py-8 px-4 overflow-y-auto`}>
        <div className={`mb-10 flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
          {sidebarOpen && (
            <span className={`text-3xl font-bold tracking-wide transition-all duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>DW<span className="text-red-500">O</span>M</span>
          )}
          <button
            className="p-2 rounded hover:bg-[#232B3E] focus:outline-none flex items-center justify-center"
            onClick={() => setSidebarOpen((v: boolean) => !v)}
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {/* Hamburger icon for closed, X for open */}
            {sidebarOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
        <nav className="flex-1">
          <ul className="space-y-2">
            {/* Sidebar nav items with text only when expanded */}
            <li className={`rounded-lg px-4 py-3 font-medium cursor-pointer ${isActive('/') ? 'bg-[#232B3E]' : 'hover:bg-[#232B3E]'} ${sidebarOpen ? '' : 'justify-center'}`} onClick={() => navigate('/')}>{sidebarOpen && <span>Dashboard</span>}</li>
            <li className={`rounded-lg px-4 py-3 cursor-pointer justify-center ${isActive('/orders') ? 'bg-[#232B3E] font-medium' : 'hover:bg-[#232B3E]'}`} onClick={() => navigate('/orders')}>{sidebarOpen && <span>Orders</span>}</li>
            <li className={`rounded-lg px-4 py-3 cursor-pointer justify-center ${isActive('/warehouse') ? 'bg-[#232B3E] font-medium' : 'hover:bg-[#232B3E]'}`} onClick={() => navigate('/warehouse')}>{sidebarOpen && <span>Warehouse Operations</span>}</li>
            <li className={`rounded-lg px-4 py-3 cursor-pointer justify-center ${isActive('/products') ? 'bg-[#232B3E] font-medium' : 'hover:bg-[#232B3E]'}`} onClick={() => navigate('/products')}>{sidebarOpen && <span>Products</span>}</li>
            <li className={`rounded-lg px-4 py-3 cursor-pointer justify-center ${isActive('/categories') ? 'bg-[#232B3E] font-medium' : 'hover:bg-[#232B3E]'}`} onClick={() => navigate('/categories')}>{sidebarOpen && <span>Categories</span>}</li>
            <li className={`rounded-lg px-4 py-3 cursor-pointer justify-center ${isActive('/bundles') ? 'bg-[#232B3E] font-medium' : 'hover:bg-[#232B3E]'}`} onClick={() => navigate('/bundles')}>{sidebarOpen && <span>Bundles</span>}</li>
            <li className={`rounded-lg px-4 py-3 cursor-pointer justify-center ${isActive('/subscriptions') ? 'bg-[#232B3E] font-medium' : 'hover:bg-[#232B3E]'}`} onClick={() => navigate('/subscriptions')}>{sidebarOpen && <span>Subscriptions</span>}</li>
            <li className={`rounded-lg px-4 py-3 cursor-pointer justify-center ${isActive('/riders') ? 'bg-[#232B3E] font-medium' : 'hover:bg-[#232B3E]'}`} onClick={() => navigate('/riders')}>{sidebarOpen && <span>Riders</span>}</li>
            <li className={`rounded-lg px-4 py-3 cursor-pointer justify-center ${isActive('/finance') ? 'bg-[#232B3E] font-medium' : 'hover:bg-[#232B3E]'}`} onClick={() => navigate('/finance')}>{sidebarOpen && <span>Finance</span>}</li>
            <li className={`rounded-lg px-4 py-3 cursor-pointer justify-center ${isActive('/marketing') ? 'bg-[#232B3E] font-medium' : 'hover:bg-[#232B3E]'}`} onClick={() => navigate('/marketing')}>{sidebarOpen && <span>Marketing</span>}</li>
            <li className={`rounded-lg px-4 py-3 cursor-pointer justify-center ${isActive('/customers') ? 'bg-[#232B3E] font-medium' : 'hover:bg-[#232B3E]'}`} onClick={() => navigate('/customers')}>{sidebarOpen && <span>Customers</span>}</li>
            <li className={`rounded-lg px-4 py-3 cursor-pointer justify-center ${isActive('/admins') ? 'bg-[#232B3E] font-medium' : 'hover:bg-[#232B3E]'}`} onClick={() => navigate('/admins')}>{sidebarOpen && <span>Admins</span>}</li>
            <li className={`rounded-lg px-4 py-3 cursor-pointer justify-center ${isActive('/support') ? 'bg-[#232B3E] font-medium' : 'hover:bg-[#232B3E]'}`} onClick={() => navigate('/support')}>{sidebarOpen && <span>Support</span>}</li>
            <li className={`rounded-lg px-4 py-3 cursor-pointer justify-center ${isActive('/settings') ? 'bg-[#232B3E] font-medium' : 'hover:bg-[#232B3E]'}`} onClick={() => navigate('/settings')}>{sidebarOpen && <span>Settings</span>}</li>
          </ul>
          {/* Logout button */}
          <button
            onClick={() => {
              adminAuthService.logout();
              navigate('/login');
            }}
            className="mt-8 w-full rounded-lg px-4 py-3 bg-red-600 text-white font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
          >
            {sidebarOpen ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            )}
          </button>
        </nav>
      </aside>
      )}
      {/* Main Content */}
      <main className={`transition-all duration-300 px-8 py-8 ${showSidebar ? `ml-16` : ''}`} style={showSidebar ? { marginLeft: sidebarOpen ? '16rem' : '4rem' } : {}}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <>
                  <h1 className="text-3xl font-bold mb-8 text-gray-900">Dashboard</h1>
                  
                  {/* Loading State */}
                  {dashboardLoading && (
                    <div className="flex items-center justify-center py-20">
                      <svg
                        className="animate-spin h-8 w-8 text-blue-600"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <p className="ml-3 text-gray-600">Loading dashboard data...</p>
                    </div>
                  )}

                  {/* Error State */}
                  {dashboardError && (
                    <div className="p-4 rounded-lg bg-red-50 text-red-700 mb-6">
                      {dashboardError}
                      <button
                        onClick={fetchDashboardData}
                        className="ml-3 text-red-600 font-medium hover:text-red-800 underline"
                      >
                        Retry
                      </button>
                    </div>
                  )}

                  {/* Dashboard Content */}
                  {dashboardData && !dashboardLoading && (
                    <>
                      {/* Stats Cards */}
                      <div className="grid grid-cols-4 gap-6 mb-10">
                        {/* Today's Orders Card */}
                        <div className="bg-white rounded-xl shadow p-6 flex flex-col justify-center items-start">
                          <span className="text-lg font-medium mb-2">Today's Orders</span>
                          <span className="text-4xl font-bold">
                            {dashboardData.stats.totalOrdersToday}
                            <span className="text-green-600 text-lg align-top ml-2">
                              +{dashboardData.stats.completedOrders}
                            </span>
                          </span>
                          <span className="text-gray-500 mt-2">Total orders today</span>
                        </div>

                        {/* Today's Revenue Card */}
                        <div className="bg-white rounded-xl shadow p-6 flex flex-col justify-center items-start">
                          <span className="text-lg font-medium mb-2">Today's Revenue</span>
                          <span className="text-4xl font-bold">
                            GH₵ {dashboardData.stats.revenueToday.toFixed(2)}
                          </span>
                          <span className="text-gray-500 mt-2">Paid orders</span>
                        </div>

                        {/* Active Riders Card */}
                        <div className="bg-white rounded-xl shadow p-6 flex flex-col justify-center items-start">
                          <span className="text-lg font-medium mb-2">Active Riders</span>
                          <span className="text-4xl font-bold">
                            {dashboardData.riderStats.activeRiders}
                            <span className="text-blue-600 text-lg align-top ml-2">
                              /{dashboardData.riderStats.totalRiders}
                            </span>
                          </span>
                          <span className="text-gray-500 mt-2">
                            Avg rating: {dashboardData.riderStats.averageRating}⭐
                          </span>
                        </div>

                        {/* Stock Status Card */}
                        <div className="bg-white rounded-xl shadow p-6 flex flex-col justify-center items-start">
                          <span className="text-lg font-medium mb-2">Inventory Status</span>
                          <span className="text-4xl font-bold">
                            {dashboardData.productStats.totalProducts}
                          </span>
                          <span className="text-gray-500 mt-2">
                            {dashboardData.productStats.outOfStockProducts} out of stock
                          </span>
                        </div>
                      </div>

                      {/* Orders Overview Section */}
                      <section className="bg-white rounded-xl shadow p-6 mb-10">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-2xl font-semibold">Orders Overview</h2>
                          <a href="/orders" className="text-blue-600 font-medium hover:underline">View all orders</a>
                        </div>
                        <OrdersOverviewChart />
                        {/* Legend */}
                        <div className="flex gap-8 mt-4 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded-full bg-[#E5D85C]"></span>
                            <span className="text-xs text-gray-700">Total Orders</span>
                            <span className="ml-1 text-xs font-bold">{dashboardData.stats.totalOrdersToday}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded-full bg-[#2EC4B6]"></span>
                            <span className="text-xs text-gray-700">Completed</span>
                            <span className="ml-1 text-xs font-bold">{dashboardData.stats.completedOrders}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded-full bg-[#FF6B6B]"></span>
                            <span className="text-xs text-gray-700">Canceled</span>
                            <span className="ml-1 text-xs font-bold">{dashboardData.stats.canceledOrders}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded-full bg-[#4A90E2]"></span>
                            <span className="text-xs text-gray-700">Revenue</span>
                            <span className="ml-1 text-xs font-bold">GH₵ {dashboardData.stats.revenueToday.toFixed(2)}</span>
                          </div>
                        </div>
                        <OrdersTable />
                      </section>

                      <PopularItems />

                      {/* Sidebar widgets moved below */}
                      <div className="grid grid-cols-3 gap-6 mt-10">
                        <RidersActivity />
                        <InventoryAlerts />
                        <QuickActions />
                      </div>
                    </>
                  )}

                  <footer className="mt-10 text-gray-400 text-sm flex justify-between">
                    <span>DWOM 2025</span>
                    <span>Terms &bull; Privacy</span>
                  </footer>
                </>
              </ProtectedRoute>
            }
          />
          <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
          <Route path="/warehouse" element={<ProtectedRoute><WarehouseOperationsPage /></ProtectedRoute>} />
          <Route path="/products" element={<ProtectedRoute><ProductsPage /></ProtectedRoute>} />
          <Route path="/categories" element={<ProtectedRoute><CategoriesPage /></ProtectedRoute>} />
          <Route path="/bundles" element={<ProtectedRoute><BundlesPage /></ProtectedRoute>} />
          <Route path="/riders" element={<ProtectedRoute><RidersPage /></ProtectedRoute>} />
          <Route path="/finance" element={<ProtectedRoute><FinancePage /></ProtectedRoute>} />
          <Route path="/marketing" element={<ProtectedRoute><MarketingPage /></ProtectedRoute>} />
          <Route path="/customers" element={<ProtectedRoute><CustomersPage /></ProtectedRoute>} />
          <Route path="/admins" element={<ProtectedRoute><AdminsPage /></ProtectedRoute>} />
          <Route path="/support" element={<ProtectedRoute><SupportPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/subscriptions" element={<ProtectedRoute><SubscriptionsPage /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
