import React, { useEffect, useState } from 'react';
import { Ban, CircleCheck, ShoppingCart, Wallet, type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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

interface Kpi {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  tint: string;
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

  // Hints mirror the backend's definitions (OrderQueryService.getStatsOverview):
  // every figure is scoped to orders *placed* today.
  const kpis: Kpi[] = [
    {
      label: 'Orders today',
      value: String(stats?.totalOrdersToday ?? 0),
      hint: stats?.allOrdersCount !== undefined ? `${stats.allOrdersCount.toLocaleString()} all time` : 'Placed since midnight',
      icon: ShoppingCart,
      tint: 'bg-sky-500/10 text-sky-600',
    },
    { label: 'Delivered', value: String(stats?.completedOrders ?? 0), hint: 'Of today’s orders', icon: CircleCheck, tint: 'bg-emerald-500/10 text-emerald-600' },
    { label: 'Cancelled', value: String(stats?.canceledOrders ?? 0), hint: 'Of today’s orders', icon: Ban, tint: 'bg-red-500/10 text-red-600' },
    { label: 'Order value today', value: formatGhs(stats?.revenueToday), hint: 'All orders placed, incl. unpaid', icon: Wallet, tint: 'bg-amber-500/10 text-amber-600' },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <Card key={kpi.label} className="gap-0 py-0 transition-shadow hover:shadow-md">
          <CardContent className="flex items-start justify-between gap-3 p-4 sm:p-5">
            <div className="min-w-0 space-y-1">
              <p className="text-sm text-muted-foreground">{kpi.label}</p>
              {stats ? (
                <p className="truncate text-2xl font-semibold tracking-tight tabular-nums">{kpi.value}</p>
              ) : failed ? (
                <p className="text-2xl font-semibold text-muted-foreground">—</p>
              ) : (
                <Skeleton className="h-8 w-20" />
              )}
              <p className="text-xs text-muted-foreground">{failed ? 'Couldn’t load' : kpi.hint}</p>
            </div>
            <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${kpi.tint}`}>
              <kpi.icon className="size-5" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default OrdersKpiCards;
