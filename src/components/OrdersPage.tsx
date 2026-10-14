import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, CalendarDays, Download, Plus, RotateCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable, type FilterConfig } from '@/components/data-table';
import ridersService from '../services/ridersService';
import { logger } from '../utils/logger';
import OrdersKpiCards from './orders/OrdersKpiCards';
import CreateOrderDialog from './orders/CreateOrderDialog';
import AssignPersonDialog from './orders/AssignPersonDialog';
import OrderDetailsSheet from './orders/details/OrderDetailsSheet';
import { buildOrderColumns, NO_ZONE, UNASSIGNED } from './orders/columns';
import LiveBadge from './orders/LiveBadge';
import { playNewOrderChime } from './orders/live-alert';
import { useOrders } from './orders/useOrders';
import type { Order } from './orders/OrderTypes';
import { formatGhs, ORDER_STATUSES, PAYMENT_METHODS, PAYMENT_STATUSES } from './orders/order-status';
import { downloadOrdersCsv } from './orders/export-csv';

type DateRange = 'today' | '7d' | '30d' | 'all';

const DATE_RANGES: { value: DateRange; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'all', label: 'All loaded orders' },
];

function rangeStart(range: DateRange): number | null {
  if (range === 'all') return null;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (range === '7d') start.setDate(start.getDate() - 6);
  if (range === '30d') start.setDate(start.getDate() - 29);
  return start.getTime();
}

const OrdersPage: React.FC = () => {
  const [riders, setRiders] = useState<{ id: string; name: string }[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>('all');
  // ?order=<id> deep-links straight into an order's details (e.g. from the Dashboard).
  const [params, setParams] = useSearchParams();
  const selectedId = params.get('order');
  const setSelectedId = useCallback(
    (id: string | null) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (id) next.set('order', id);
          else next.delete('order');
          return next;
        },
        { replace: true },
      ),
    [setParams],
  );
  const [assign, setAssign] = useState<{ kind: 'rider' | 'picker'; orderId: string } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [statsKey, setStatsKey] = useState(0);
  const { orders, loading, error, refresh, patchOrder, newIds, updatedAt } = useOrders((fresh) => {
    playNewOrderChime();
    setStatsKey((k) => k + 1);
    const [first] = fresh;
    toast.success(fresh.length === 1 ? `New order #${first.id}` : `${fresh.length} new orders`, {
      description: fresh.length === 1 ? `${first.customer} · ${formatGhs(first.total)}` : fresh.map((o) => `#${o.id}`).join(', '),
      action: fresh.length === 1 ? { label: 'View', onClick: () => setSelectedId(first.id) } : undefined,
      duration: 8000,
    });
  });

  // Every rider, not just ones on loaded orders, so a rider with no orders
  // yet still appears as a filter option.
  useEffect(() => {
    ridersService
      .getAllRiders()
      .then((rs) => setRiders(rs.map((r) => ({ id: String(r.id), name: r.name }))))
      .catch((err) => logger.error('❌ [OrdersPage] Failed to fetch riders for filters:', err));
  }, []);

  const visibleOrders = useMemo(() => {
    const start = rangeStart(dateRange);
    return start === null ? orders : orders.filter((o) => new Date(o.createdAt).getTime() >= start);
  }, [orders, dateRange]);

  const selectedOrder = orders.find((o) => o.id === selectedId) ?? null;
  const assignOrder = assign ? (orders.find((o) => o.id === assign.orderId) ?? null) : null;

  const columns = useMemo(
    () =>
      buildOrderColumns({
        onView: (o) => setSelectedId(o.id),
        onAssignRider: (o) => setAssign({ kind: 'rider', orderId: o.id }),
        onAssignPicker: (o) => setAssign({ kind: 'picker', orderId: o.id }),
      }),
    [setSelectedId],
  );

  const filters: FilterConfig[] = useMemo(
    () => [
      { columnId: 'status', title: 'Status', options: ORDER_STATUSES.map(({ value, label, icon }) => ({ value, label, icon })) },
      { columnId: 'payment', title: 'Payment', options: PAYMENT_STATUSES.map(({ value, label }) => ({ value, label })) },
      { columnId: 'method', title: 'Method', options: PAYMENT_METHODS.map(({ value, label, icon }) => ({ value, label, icon })) },
      {
        columnId: 'rider',
        title: 'Rider',
        options: [{ value: UNASSIGNED, label: 'Unassigned' }, ...riders.map((r) => ({ value: r.id, label: r.name }))],
      },
      {
        columnId: 'zone',
        title: 'Zone',
        options: [
          ...[...new Set(orders.map((o) => o.zone).filter((z): z is string => !!z))].sort().map((z) => ({ value: z, label: z })),
          { value: NO_ZONE, label: 'Not recorded' },
        ],
      },
    ],
    [riders, orders],
  );

  const handleOrderChange = (id: string, patch: Partial<Order>) => {
    patchOrder(id, patch);
    if (patch.orderStatus) setStatsKey((k) => k + 1);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
            {!loading && !error && <LiveBadge updatedAt={updatedAt} />}
          </div>
          <p className="text-sm text-muted-foreground">Track, assign, and update every DWOM order.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus />
          Create order
        </Button>
      </div>

      <OrdersKpiCards refreshKey={statsKey} />

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="size-4" />
            Couldn’t load orders: {error}
          </div>
          <Button variant="outline" size="sm" onClick={refresh}>
            <RotateCw />
            Retry
          </Button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={visibleOrders}
        isLoading={loading}
        getRowId={(o) => o.id}
        initialSorting={[{ id: 'placed', desc: true }]}
        initialHidden={{ method: false }}
        searchPlaceholder="Search order #, customer, phone, address…"
        filters={filters}
        onRowClick={(o) => setSelectedId(o.id)}
        rowClassName={(o) => (newIds.has(o.id) ? 'flash-new' : undefined)}
        emptyMessage={dateRange === 'all' ? 'No orders match these filters.' : 'No orders in this date range.'}
        toolbarStart={
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
            <SelectTrigger size="sm" className="h-8 w-auto gap-2">
              <CalendarDays className="size-4 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_RANGES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        toolbarActions={(table) => (
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            disabled={loading || table.getFilteredRowModel().rows.length === 0}
            onClick={() => downloadOrdersCsv(table.getFilteredRowModel().rows.map((r) => r.original))}
          >
            <Download />
            Export
          </Button>
        )}
        bulkActions={(rows, clear) => (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              downloadOrdersCsv(rows);
              clear();
            }}
          >
            <Download />
            Export {rows.length}
          </Button>
        )}
      />

      <OrderDetailsSheet
        order={selectedOrder}
        open={selectedOrder !== null}
        onOpenChange={(open) => !open && setSelectedId(null)}
        onOrderChange={handleOrderChange}
        onAssignRider={(o) => setAssign({ kind: 'rider', orderId: o.id })}
        onAssignPicker={(o) => setAssign({ kind: 'picker', orderId: o.id })}
      />

      <AssignPersonDialog
        kind={assign?.kind ?? 'rider'}
        order={assignOrder}
        open={assign !== null}
        onOpenChange={(open) => !open && setAssign(null)}
        onAssigned={(orderId, person) => patchOrder(orderId, assign?.kind === 'picker' ? { picker: person } : { rider: person })}
      />

      <CreateOrderDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          refresh();
          setStatsKey((k) => k + 1);
        }}
      />
    </div>
  );
};

export default OrdersPage;
