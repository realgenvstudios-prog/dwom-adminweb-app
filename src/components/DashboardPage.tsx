import React from 'react';
import { Link } from 'react-router-dom';
import { Bike, RefreshCw, ShoppingCart, Users, Wallet, WalletCards } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/stat-card';
import { cn } from '@/lib/utils';
import adminAuthService from '../services/authService';
import { canAccessRoute, resolveUiRole } from '../config/permissions';
import { formatGhs } from './orders/order-status';
import { useOrders } from './orders/useOrders';
import { isOnline, useDashboard } from './dashboard/useDashboard';
import NeedsAttentionCard from './dashboard/NeedsAttentionCard';
import OrderPipeline from './dashboard/OrderPipeline';
import RecentOrders from './dashboard/RecentOrders';
import RidersCard from './dashboard/RidersCard';
import TopSellers from './dashboard/TopSellers';
import WeekChart from './dashboard/WeekChart';

function greeting(hour: number) {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/** % change, or null when there's nothing to compare against. */
function pctChange(today: number, yesterday: number): number | null {
  if (yesterday === 0) return null;
  return ((today - yesterday) / yesterday) * 100;
}

const DashboardPage: React.FC = () => {
  const admin = adminAuthService.getCurrentAdmin();
  const role = resolveUiRole(admin);
  const can = (path: string) => canAccessRoute(role, path);
  const firstName = (admin?.name || '').trim().split(/\s+/)[0];

  const { data, loading, refreshing, updatedAt, refresh } = useDashboard();
  const orders = useOrders();

  const refreshAll = () => {
    refresh();
    orders.refresh();
  };

  const now = new Date();
  const stats = data?.orderStats;
  const today = data?.week?.[6];
  const yesterday = data?.week?.[5];
  const riders = data?.riders;
  const activeRiders = riders?.filter((r) => r.isActive) ?? [];
  const delivered = stats?.completedOrders ?? 0;
  const cancelled = stats?.cancelledOrders ?? stats?.canceledOrders ?? 0;
  const ordersLoading = orders.loading && orders.orders.length === 0;
  const withoutRider = ordersLoading
    ? null
    : orders.orders.filter((o) => !o.rider && o.orderStatus !== 'delivered' && o.orderStatus !== 'cancelled').length;
  const showRecentOrders = can('/orders');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {greeting(now.getHours())}
            {firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="text-sm text-muted-foreground">
            {now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} · here’s how DWOM is doing today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {updatedAt && (
            <span className="hidden text-xs text-muted-foreground sm:inline">
              Updated {updatedAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <Button variant="outline" size="icon-sm" onClick={refreshAll} disabled={refreshing} aria-label="Refresh">
            <RefreshCw className={cn(refreshing && 'animate-spin')} />
          </Button>
          {can('/finance') && (
            <Button variant="outline" size="sm" asChild>
              <Link to="/finance">
                <WalletCards />
                Financials
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Orders today"
          value={String(stats?.totalOrdersToday ?? 0)}
          hint={`${delivered} delivered · ${cancelled} cancelled`}
          change={today && yesterday ? pctChange(today.orders, yesterday.orders) : null}
          icon={ShoppingCart}
          tint="bg-sky-500/10 text-sky-600"
          loading={loading}
          failed={!loading && !stats}
          href={can('/orders') ? '/orders' : undefined}
        />
        <StatCard
          label="Paid revenue today"
          value={formatGhs(today?.paid)}
          hint={yesterday ? `${formatGhs(yesterday.paid)} yesterday` : 'Payment received'}
          change={today && yesterday ? pctChange(today.paid, yesterday.paid) : null}
          icon={Wallet}
          tint="bg-emerald-500/10 text-emerald-600"
          loading={loading}
          failed={!loading && !data?.week}
          href={can('/finance') ? '/finance' : undefined}
        />
        <StatCard
          label="Riders online"
          value={String(activeRiders.filter(isOnline).length)}
          hint={`of ${activeRiders.length} active riders`}
          icon={Bike}
          tint="bg-violet-500/10 text-violet-600"
          loading={loading}
          failed={!loading && !riders}
          href={can('/field-operations') ? '/field-operations' : undefined}
        />
        <StatCard
          label="Customers"
          value={(data?.totalCustomers ?? 0).toLocaleString()}
          hint="Registered accounts"
          icon={Users}
          tint="bg-amber-500/10 text-amber-600"
          loading={loading}
          failed={!loading && data?.totalCustomers == null}
          href={can('/customers') ? '/customers' : undefined}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <OrderPipeline orders={orders.orders} loading={ordersLoading} error={orders.error} linkable={can('/orders')} />
        </div>
        <NeedsAttentionCard
          role={role}
          outOfStockProducts={loading ? null : (data?.productStats?.outOfStockProducts ?? 0)}
          ordersWithoutRider={withoutRider}
          refreshKey={updatedAt?.getTime() ?? 0}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WeekChart week={data?.week ?? null} loading={loading} />
        </div>
        <RidersCard riders={riders ?? null} loading={loading} linkable={can('/field-operations')} />
      </div>

      <div className={cn('grid gap-6', showRecentOrders && 'lg:grid-cols-2')}>
        {showRecentOrders && <RecentOrders orders={orders.orders} loading={ordersLoading} error={orders.error} linkable />}
        <TopSellers refreshKey={updatedAt?.getTime() ?? 0} />
      </div>
    </div>
  );
};

export default DashboardPage;
