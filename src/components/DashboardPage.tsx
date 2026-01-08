import React, { useState, useEffect } from 'react';
import dashboardService from '../services/dashboardService';
import OrdersOverviewChart from './OrdersOverviewChart';
import PopularItems from './PopularItems';
import RidersActivity from './RidersActivity';
import QuickActions from './QuickActions';
import InventoryAlerts from './InventoryAlerts';

interface KPICard {
  title: string;
  value: string | number;
  change: string;
  icon: string;
  color: string;
}

const DashboardPage: React.FC = () => {
  const [kpis, setKpis] = useState<KPICard[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
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
          icon: '📦',
          color: 'bg-blue-500',
        },
        {
          title: "Today's Revenue",
          value: `GH₵${dashboardData.stats.revenueToday.toFixed(2)}`,
          change: `${dashboardData.stats.completedOrders} orders`,
          icon: '💰',
          color: 'bg-green-500',
        },
        {
          title: 'Active Riders',
          value: dashboardData.riderStats.activeRiders,
          change: `${dashboardData.riderStats.totalRiders} total`,
          icon: '🚴',
          color: 'bg-purple-500',
        },
        {
          title: 'Products',
          value: dashboardData.productStats.totalProducts,
          change: `${dashboardData.productStats.outOfStockProducts} out of stock`,
          icon: '📊',
          color: 'bg-orange-500',
        },
      ];

      setKpis(kpiData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Some features may be offline.');
      // Set placeholder data so the page doesn't break
      setKpis([
        {
          title: 'Total Orders',
          value: '0',
          change: 'Loading...',
          icon: '📦',
          color: 'bg-blue-500',
        },
        {
          title: "Today's Revenue",
          value: 'GH₵0.00',
          change: 'Loading...',
          icon: '💰',
          color: 'bg-green-500',
        },
        {
          title: 'Active Riders',
          value: '0',
          change: 'Loading...',
          icon: '🚴',
          color: 'bg-purple-500',
        },
        {
          title: 'Products',
          value: '0',
          change: 'Loading...',
          icon: '📊',
          color: 'bg-orange-500',
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">{kpi.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{kpi.value}</p>
                <p className="text-gray-500 text-xs mt-3">{kpi.change}</p>
              </div>
              <div className={`${kpi.color} text-white p-3 rounded-lg text-2xl`}>{kpi.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Charts & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <OrdersOverviewChart />
        </div>
        <div className="lg:col-span-1">
          <PopularItems />
        </div>
      </div>

      {/* Riders & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RidersActivity />
        </div>
        <div className="lg:col-span-1">
          <InventoryAlerts />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
