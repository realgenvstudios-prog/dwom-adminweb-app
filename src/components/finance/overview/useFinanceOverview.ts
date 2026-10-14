import { useCallback, useEffect, useState } from 'react';
import apiClient from '../../../services/apiClient';
import { logger } from '../../../utils/logger';
import type { Range } from './period';

export interface PeriodFigures {
  gmv: number;
  netRevenue: number;
  orders: number;
  paidOrders: number;
  failedOrders: number;
  grossProfit: number;
  grossProfitIsEstimate: boolean;
  avgOrderValue: number;
  failedPaymentRate: number;
  newCustomers: number;
}

export interface SeriesPoint {
  key: string;
  gmv: number;
  paid: number;
  orders: number;
}

/** GET /admin/finance/summary: everything the overview shows, for one period. */
export interface FinanceSummary {
  range: { start: string | null; end: string };
  previousRange: { start: string; end: string } | null;
  current: PeriodFigures;
  previous: PeriodFigures | null;
  mrr: number;
  activeSubscriptions: number;
  grossProfitMargin: number;
  granularity: 'day' | 'week' | 'month';
  series: SeriesPoint[];
  zones: { zoneId: number | null; zoneName: string; revenue: number; orders: number }[];
  topCustomers: { id: number; name: string; phone: string; paidOrders: number; spend: number }[];
  failedPayments: { orderId: number; customer: string; amount: number; method: string; createdAt: string }[];
}

export function useFinanceOverview(range: Range) {
  const [state, setState] = useState<{ key: string; data: FinanceSummary | null; error: string | null } | null>(null);
  const query = new URLSearchParams(
    Object.entries({ start: range.start, end: range.end, compareStart: range.compareStart, compareEnd: range.compareEnd }).filter((e): e is [string, string] => !!e[1]),
  ).toString();

  const load = useCallback(async () => {
    try {
      const data = await apiClient.get<FinanceSummary>(`/admin/finance/summary?${query}`);
      setState({ key: query, data, error: null });
    } catch (err) {
      logger.error('❌ [Finance] Failed to load summary:', err);
      setState((prev) => ({ key: query, data: prev?.key === query ? prev.data : null, error: err instanceof Error ? err.message : 'Couldn’t load finance figures' }));
    }
  }, [query]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    const id = setInterval(() => void load(), 5 * 60 * 1000);
    return () => {
      clearTimeout(t);
      clearInterval(id);
    };
  }, [load]);

  const current = state?.key === query ? state : null;
  return { data: current?.data ?? null, error: current?.error ?? null, loading: !current, refresh: load };
}
