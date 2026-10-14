import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import dashboardService from '../services/dashboardService';
import PopularItems from './PopularItems';
import RidersActivity from './RidersActivity';
import NeedsAttentionCard from './NeedsAttentionCard';
import { logger } from '../utils/logger';

interface KPICard {
  title: string;
  value: string | number;
  change: string;
  color: string;
}

const REFRESH_INTERVAL = 3 * 60 * 1000; // 3 minutes for main dashboard

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<KPICard[]>([]);
  const [outOfStockProducts, setOutOfStockProducts] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();

    // Set up auto-refresh interval
    const interval = setInterval(() => {
      fetchDashboardData();
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setError(null);

      const dashboardData = await dashboardService.getDashboardData();

      const kpiData: KPICard[] = [
        {
          title: 'Total Orders',
          value: dashboardData.stats.allOrdersCount,
          change: `${dashboardData.stats.completedOrders} completed today`,
          color: 'bg-blue-500',
        },
        {
          title: "Today's Revenue",
          value: `GH₵${dashboardData.stats.revenueToday.toFixed(2)}`,
          change: `${dashboardData.stats.completedOrders} orders`,
          color: 'bg-green-500',
        },
        {
          title: 'Active Riders',
          value: dashboardData.riderStats.activeRiders,
          change: `${dashboardData.riderStats.totalRiders} total`,
          color: 'bg-purple-500',
        },
        {
          title: 'Products',
          value: dashboardData.productStats.totalProducts,
          change: `${dashboardData.productStats.outOfStockProducts} out of stock`,
          color: 'bg-orange-500',
        },
        {
          title: 'Total Customers',
          value: dashboardData.totalCustomers,
          change: 'Registered accounts',
          color: 'bg-pink-500',
        },
      ];

      setKpis(kpiData);
      setOutOfStockProducts(dashboardData.productStats.outOfStockProducts);
    } catch (err) {
      logger.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Some features may be offline.');
      // Set placeholder data so the page doesn't break
      setKpis([
        {
          title: 'Total Orders',
          value: '0',
          change: 'Loading...',
          color: 'bg-blue-500',
        },
        {
          title: "Today's Revenue",
          value: 'GH₵0.00',
          change: 'Loading...',
          color: 'bg-green-500',
        },
        {
          title: 'Active Riders',
          value: '0',
          change: 'Loading...',
          color: 'bg-purple-500',
        },
        {
          title: 'Products',
          value: '0',
          change: 'Loading...',
          color: 'bg-orange-500',
        },
        {
          title: 'Total Customers',
          value: '0',
          change: 'Loading...',
          color: 'bg-pink-500',
        },
      ]);
    } finally {
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's what's happening with your business.</p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <p className="text-sm text-yellow-700">{error}</p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {kpis.map((kpi, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">{kpi.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{kpi.value}</p>
                <p className="text-gray-500 text-xs mt-3">{kpi.change}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Popular Items - Full Width */}
      <PopularItems />

      {/* Financials live in one place — Finance — rather than a
          shallower duplicate chart here. */}
      <button
        onClick={() => navigate('/finance')}
        className="w-full bg-white rounded-xl shadow-sm p-6 flex items-center justify-between hover:shadow-md transition-shadow text-left"
      >
        <div>
          <div className="font-semibold text-gray-900">Revenue, P&L, and margin</div>
          <div className="text-sm text-gray-500 mt-1">Full breakdown lives on the Finance page</div>
        </div>
        <span className="text-blue-600 font-semibold">View full financials →</span>
      </button>

      {/* Riders & Attention Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RidersActivity />
        </div>
        <div className="lg:col-span-1">
          <NeedsAttentionCard outOfStockProducts={outOfStockProducts} />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
