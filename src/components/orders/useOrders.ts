import { useCallback, useEffect, useRef, useState } from 'react';
import ordersService, { type AdminOrderSummary } from '../../services/ordersService';
import { logger } from '../../utils/logger';
import type { Order } from './OrderTypes';
import { normalizeOrderStatus, normalizePaymentStatus } from './order-status';

// The list endpoint selects TripOrder (for the picker) and paymentReference,
// which AdminOrderSummary doesn't model.
export type ListOrder = AdminOrderSummary & {
  paymentReference?: string | null;
  TripOrder?: Array<{ Trip?: { Worker?: { id: number; name: string } | null } | null }>;
};

export function toOrder(o: ListOrder): Order {
  const worker = o.TripOrder?.[0]?.Trip?.Worker;
  return {
    id: String(o.id),
    createdAt: o.createdAt,
    customer: o.User?.name || `User ${o.userId}`,
    phone: o.User?.phoneNumber || '',
    address: o.Address?.addressText || '',
    zone: o.Zone?.name ?? null,
    rider: o.Rider ? { id: String(o.Rider.id), name: o.Rider.User?.name || `Rider ${o.Rider.id}` } : null,
    picker: worker ? { id: String(worker.id), name: worker.name } : null,
    itemsCount: (o._count?.OrderItem ?? 0) + (o._count?.BundleOrderItem ?? 0),
    subtotal: Number(o.subtotal ?? 0),
    deliveryFee: Number(o.deliveryFee ?? 0),
    serviceFee: Number(o.serviceFee ?? 0),
    couponDiscount: Number(o.couponDiscount ?? 0),
    total: Number(o.total ?? 0),
    paymentStatus: normalizePaymentStatus(o.paymentStatus),
    paymentMethod: o.paymentMethod || 'cash',
    orderStatus: normalizeOrderStatus(o.status),
    paymentRef: o.paymentReference ?? undefined,
  };
}

const POLL_MS = 20_000;

/**
 * All orders, kept live: every 20s while the tab is visible the newest page
 * is fetched and merged in (new orders added, changed ones updated), so the
 * list never needs a manual refresh. `onNew` fires for orders that weren't
 * there before.
 */
export function useOrders(onNew?: (orders: Order[]) => void) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const known = useRef<Set<string> | null>(null);
  const onNewRef = useRef(onNew);
  useEffect(() => {
    onNewRef.current = onNew;
  });

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ordersService.getAll();
      const list = Array.isArray(data) ? (data as ListOrder[]).map(toOrder) : [];
      known.current = new Set(list.map((o) => o.id));
      setOrders(list);
      setUpdatedAt(Date.now());
    } catch (err) {
      logger.error('❌ [OrdersPage] Failed to fetch orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  const poll = useCallback(async () => {
    if (!known.current || document.visibilityState !== 'visible') return;
    try {
      const latest = ((await ordersService.getLatest(50)) as ListOrder[]).map(toOrder);
      const seen = known.current;
      const fresh = latest.filter((o) => !seen.has(o.id));
      fresh.forEach((o) => seen.add(o.id));
      const byId = new Map(latest.map((o) => [o.id, o]));
      setOrders((prev) => [...fresh, ...prev.map((o) => byId.get(o.id) ?? o)]);
      setUpdatedAt(Date.now());
      if (fresh.length) {
        setNewIds(new Set(fresh.map((o) => o.id)));
        onNewRef.current?.(fresh);
      }
    } catch (err) {
      // A missed poll isn't worth an error banner; the next one retries.
      logger.warn('[OrdersPage] Live update failed:', err);
    }
  }, []);

  useEffect(() => {
    const first = setTimeout(() => void refresh(), 0);
    const id = setInterval(() => void poll(), POLL_MS);
    const onVisible = () => document.visibilityState === 'visible' && void poll();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearTimeout(first);
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refresh, poll]);

  /** Apply a change made elsewhere (status, payment, rider, picker) without refetching. */
  const patchOrder = useCallback((id: string, patch: Partial<Order>) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  }, []);

  return { orders, loading, error, refresh, patchOrder, newIds, updatedAt };
}
