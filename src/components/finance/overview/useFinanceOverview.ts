import { useCallback, useEffect, useState } from 'react';
import apiClient from '../../../services/apiClient';
import financeService, { type FailedPayment, type FinanceKPIs, type RevenueByZone } from '../../../services/financeService';
import { logger } from '../../../utils/logger';

export interface DayPoint {
  date: string;
  gmv: number;
  paid: number;
  orders: number;
}

export interface TopCustomer {
  id: number;
  name: string;
  phone: string;
  totalOrders: number;
  totalSpend: number;
}

export interface FinanceOverviewData {
  kpis: FinanceKPIs | null;
  days: DayPoint[] | null;
  zones: RevenueByZone[] | null;
  customers: TopCustomer[] | null;
  failed: FailedPayment[] | null;
}

function settled<T>(r: PromiseSettledResult<T>, label: string): T | null {
  if (r.status === 'fulfilled') return r.value;
  logger.error(`❌ [Finance] Failed to load ${label}:`, r.reason);
  return null;
}

// The trends endpoint only returns days that had orders; fill the gaps.
function fillDays(raw: { date: string; gmv: number; net: number; orders: number }[], count: number): DayPoint[] {
  const byDate = new Map(raw.map((d) => [d.date, d]));
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - (count - 1 - i));
    const key = d.toISOString().slice(0, 10);
    const hit = byDate.get(key);
    return { date: key, gmv: hit?.gmv ?? 0, paid: hit?.net ?? 0, orders: hit?.orders ?? 0 };
  });
}

export function useFinanceOverview() {
  const [data, setData] = useState<FinanceOverviewData | null>(null);

  const load = useCallback(async () => {
    const [kpis, trends, zones, customers, failed] = await Promise.allSettled([
      apiClient.get<FinanceKPIs>('/admin/finance/kpis'),
      // Called directly: financeService.getRevenueTrends drops the order count.
      apiClient.get<{ date: string; gmv: number; net: number; orders: number }[]>('/admin/finance/revenue-trends?days=29'),
      financeService.getRevenueByZone(),
      // Accurate all-time paid spend per customer (financeService's version
      // only sees the 50 newest orders and counts unpaid ones).
      apiClient.get<Array<{ id: number; name?: string; phone?: string; totalOrders?: number; totalSpend?: number }>>('/users/admin/customers'),
      financeService.getFailedPayments(6),
    ]);
    const trendRows = settled(trends, 'revenue trends');
    const customerRows = settled(customers, 'customers');
    setData({
      kpis: settled(kpis, 'KPIs'),
      days: Array.isArray(trendRows) ? fillDays(trendRows, 30) : null,
      zones: settled(zones, 'revenue by zone'),
      customers: Array.isArray(customerRows)
        ? customerRows
            .map((c) => ({ id: c.id, name: c.name || 'Unnamed customer', phone: c.phone ?? '', totalOrders: c.totalOrders ?? 0, totalSpend: c.totalSpend ?? 0 }))
            .filter((c) => c.totalSpend > 0)
            .sort((a, b) => b.totalSpend - a.totalSpend)
            .slice(0, 6)
        : null,
      failed: settled(failed, 'failed payments'),
    });
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    const id = setInterval(() => void load(), 5 * 60 * 1000);
    return () => {
      clearTimeout(t);
      clearInterval(id);
    };
  }, [load]);

  return { data, loading: data === null, refresh: load };
}
