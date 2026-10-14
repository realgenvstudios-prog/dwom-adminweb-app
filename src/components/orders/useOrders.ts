import { useCallback, useEffect, useState } from 'react';
import ordersService, { type AdminOrderSummary } from '../../services/ordersService';
import { logger } from '../../utils/logger';
import type { Order } from './OrderTypes';
import { normalizeOrderStatus, normalizePaymentStatus } from './order-status';

// The list endpoint selects TripOrder (for the picker) and paymentReference,
// which AdminOrderSummary doesn't model.
type ListOrder = AdminOrderSummary & {
  paymentReference?: string | null;
  TripOrder?: Array<{ Trip?: { Worker?: { id: number; name: string } | null } | null }>;
};

function toOrder(o: ListOrder): Order {
  const worker = o.TripOrder?.[0]?.Trip?.Worker;
  return {
    id: String(o.id),
    createdAt: o.createdAt,
    customer: o.User?.name || `User ${o.userId}`,
    phone: o.User?.phoneNumber || '',
    address: o.Address?.addressText || '',
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

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ordersService.getAll();
      setOrders(Array.isArray(data) ? (data as ListOrder[]).map(toOrder) : []);
    } catch (err) {
      logger.error('❌ [OrdersPage] Failed to fetch orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Apply a change made elsewhere (status, payment, rider, picker) without refetching. */
  const patchOrder = useCallback((id: string, patch: Partial<Order>) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  }, []);

  return { orders, loading, error, refresh, patchOrder };
}
