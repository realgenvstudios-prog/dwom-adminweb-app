import React, { useEffect, useState } from 'react';
import { Ban, CircleCheck, ShoppingCart, Wallet } from 'lucide-react';
import { StatCard } from '@/components/stat-card';
import ordersService from '../../services/ordersService';
import { logger } from '../../utils/logger';
import { formatGhs } from './order-status';

interface Stats {
  totalOrdersToday: number;
  completedOrders: number;
  canceledOrders: number;
  revenueToday: number;
  allOrdersCount?: number;
}

const OrdersKpiCards: React.FC<{ refreshKey?: number }> = ({ refreshKey = 0 }) => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    ordersService
      .getStats()
      .then((s) => {
        if (!cancelled) {
          setStats(s);
          setFailed(false);
        }
      })
      .catch((err) => {
        logger.error('❌ [OrdersKpiCards] Failed to fetch stats:', err);
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const loading = !stats && !failed;

  // Hints mirror the backend's definitions (OrderQueryService.getStatsOverview):
  // every figure is scoped to orders *placed* today.
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard
        label="Orders today"
        value={String(stats?.totalOrdersToday ?? 0)}
        hint={stats?.allOrdersCount !== undefined ? `${stats.allOrdersCount.toLocaleString()} all time` : 'Placed since midnight'}
        icon={ShoppingCart}
        tint="bg-sky-500/10 text-sky-600"
        loading={loading}
        failed={failed}
      />
      <StatCard
        label="Delivered"
        value={String(stats?.completedOrders ?? 0)}
        hint="Of today’s orders"
        icon={CircleCheck}
        tint="bg-emerald-500/10 text-emerald-600"
        loading={loading}
        failed={failed}
      />
      <StatCard
        label="Cancelled"
        value={String(stats?.canceledOrders ?? 0)}
        hint="Of today’s orders"
        icon={Ban}
        tint="bg-red-500/10 text-red-600"
        loading={loading}
        failed={failed}
      />
      <StatCard
        label="Order value today"
        value={formatGhs(stats?.revenueToday)}
        hint="All orders placed, incl. unpaid"
        icon={Wallet}
        tint="bg-amber-500/10 text-amber-600"
        loading={loading}
        failed={failed}
      />
    </div>
  );
};

export default OrdersKpiCards;
