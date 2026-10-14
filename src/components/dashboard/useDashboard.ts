import { useCallback, useEffect, useState } from 'react';
import adminApiClient from '../../services/apiClient';
import dashboardService, { type DashboardStats, type ProductStats } from '../../services/dashboardService';
import ridersService, { type RiderData } from '../../services/ridersService';
import { logger } from '../../utils/logger';

// /admin/dashboard/orders spells it `cancelledOrders`; the service type says `canceledOrders`.
type OrderStats = DashboardStats & { cancelledOrders?: number };

/** One calendar day (UTC — same as Ghana time). gmv = all orders placed; paid = paymentStatus 'paid'. */
export interface DayPoint {
  date: string;
  orders: number;
  gmv: number;
  paid: number;
}

export interface DashboardSnapshot {
  orderStats: OrderStats | null;
  productStats: ProductStats | null;
  totalCustomers: number | null;
  riders: RiderData[] | null;
  /** Last 7 days ending today, gaps filled with zeros. */
  week: DayPoint[] | null;
}

/** Rider app sets status; an enabled rider is online unless they've gone offline. */
export function isOnline(r: RiderData) {
  return r.isActive && r.status !== 'offline';
}

const REFRESH_MS = 3 * 60 * 1000;

function settled<T>(r: PromiseSettledResult<T>, label: string): T | null {
  if (r.status === 'fulfilled') return r.value;
  logger.error(`❌ [Dashboard] Failed to load ${label}:`, r.reason);
  return null;
}

// FinanceKpiService.getRevenueTrends only returns days that had orders.
function fillWeek(raw: { date: string; gmv: number; net: number; orders: number }[]): DayPoint[] {
  const byDate = new Map(raw.map((d) => [d.date, d]));
  const days: DayPoint[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    const hit = byDate.get(key);
    days.push({ date: key, orders: hit?.orders ?? 0, gmv: hit?.gmv ?? 0, paid: hit?.net ?? 0 });
  }
  return days;
}

/** Each figure loads independently so one failing endpoint doesn't blank the whole page. */
export function useDashboard() {
  const [data, setData] = useState<DashboardSnapshot | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    const [orders, products, customers, riders, trends] = await Promise.allSettled([
      dashboardService.getOrderStats(),
      dashboardService.getProductStats(),
      dashboardService.getTotalCustomers(),
      ridersService.getAllRiders(),
      // Called directly: financeService.getRevenueTrends drops the per-day order count.
      adminApiClient.get<{ date: string; gmv: number; net: number; orders: number }[]>('/admin/finance/revenue-trends?days=7'),
    ]);
    const trendRows = settled(trends, 'weekly trend');
    setData({
      orderStats: settled(orders, 'order stats'),
      productStats: settled(products, 'product stats'),
      totalCustomers: settled(customers, 'customers'),
      riders: settled(riders, 'riders'),
      week: Array.isArray(trendRows) ? fillWeek(trendRows) : null,
    });
    setUpdatedAt(new Date());
    setRefreshing(false);
  }, []);

  /** Manual refresh: same load, with a spinner. */
  const refresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  useEffect(() => {
    const tick = () => void load();
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, REFRESH_MS);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [load]);

  return { data, loading: data === null, refreshing, updatedAt, refresh };
}
