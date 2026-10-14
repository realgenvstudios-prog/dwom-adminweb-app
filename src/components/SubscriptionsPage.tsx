import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { AlertCircle, AlertTriangle, CalendarClock, Download, Repeat, RotateCw, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, DataTableColumnHeader, facetedFilterFn } from '@/components/data-table';
import { StatCard } from '@/components/stat-card';
import { cn } from '@/lib/utils';
import subscriptionsService, { type Subscription } from '../services/subscriptionsService';
import { logger } from '../utils/logger';
import { formatDate } from './customers/CustomerTypes';
import { formatGhs } from './orders/order-status';
import SubscriptionSheet from './subscriptions/SubscriptionSheet';
import { FREQUENCIES, STATUSES, basketSummary, basketValue, customerName, frequencyLabel, monthlyValue, num, paymentFailing, statusOf } from './subscriptions/subscription-meta';

const DAY = 24 * 60 * 60 * 1000;

const csvCell = (v: unknown) => {
  const s = String(v ?? '');
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

function exportCsv(rows: Subscription[]) {
  const header = ['ID', 'Customer', 'Phone', 'Status', 'Payment failing', 'Frequency', 'Per delivery (GHS)', 'Per month (GHS)', 'Next billing', 'Spent so far (GHS)', 'Items'];
  const lines = rows.map((s) =>
    [s.id, customerName(s), s.User?.phoneNumber ?? '', statusOf(s.status).label, paymentFailing(s) ? 'yes' : 'no', frequencyLabel(s.frequency), basketValue(s).toFixed(2), monthlyValue(s).toFixed(2), s.nextBillingDate.slice(0, 10), num(s.totalSpent).toFixed(2), basketSummary(s)]
      .map(csvCell)
      .join(','),
  );
  const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `subscriptions-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const [now] = useState(() => Date.now());

  const load = useCallback(async () => {
    try {
      setError(null);
      setSubs(await subscriptionsService.getAllSubscriptions());
    } catch (err) {
      logger.error('Failed to load subscriptions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  const columns = useMemo<ColumnDef<Subscription>[]>(
    () => [
      {
        id: 'customer',
        accessorFn: (s) => `${customerName(s)} ${s.User?.phoneNumber ?? ''} ${s.name ?? ''} ${basketSummary(s)}`,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Customer" />,
        sortingFn: (a, b) => customerName(a.original).localeCompare(customerName(b.original)),
        cell: ({ row }) => (
          <div className="max-w-[280px] min-w-[180px]">
            <p className="truncate font-medium">{customerName(row.original)}</p>
            <p className="truncate text-xs text-muted-foreground">{basketSummary(row.original)}</p>
          </div>
        ),
        meta: { title: 'Customer' },
      },
      {
        id: 'status',
        accessorKey: 'status',
        header: 'Status',
        filterFn: facetedFilterFn,
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => {
          const st = statusOf(row.original.status);
          return (
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className={st.className}>
                {st.label}
              </Badge>
              {paymentFailing(row.original) && (
                <Badge variant="outline" className="gap-1 border-red-500/20 bg-red-500/10 text-red-700">
                  <AlertTriangle className="size-3" />
                  Payment
                </Badge>
              )}
            </div>
          );
        },
        meta: { title: 'Status' },
      },
      {
        id: 'payment',
        accessorFn: (s) => (paymentFailing(s) ? 'failing' : 'ok'),
        filterFn: facetedFilterFn,
        // Filter-only column: kept hidden and out of the View menu.
        enableHiding: false,
        header: () => null,
        cell: () => null,
      },
      {
        id: 'frequency',
        accessorKey: 'frequency',
        header: 'Frequency',
        filterFn: facetedFilterFn,
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => <span className="whitespace-nowrap text-muted-foreground">{frequencyLabel(row.original.frequency)}</span>,
        meta: { title: 'Frequency' },
      },
      {
        id: 'value',
        accessorFn: (s) => basketValue(s),
        header: ({ column }) => <DataTableColumnHeader column={column} title="Per delivery" className="justify-end" />,
        enableGlobalFilter: false,
        cell: ({ row }) => <div className="text-right font-medium whitespace-nowrap tabular-nums">{formatGhs(basketValue(row.original))}</div>,
        meta: { title: 'Per delivery', className: 'text-right' },
      },
      {
        id: 'next',
        accessorFn: (s) => (s.status === 'active' ? new Date(s.nextBillingDate).getTime() : Number.MAX_SAFE_INTEGER),
        header: ({ column }) => <DataTableColumnHeader column={column} title="Next billing" />,
        enableGlobalFilter: false,
        cell: ({ row }) => {
          const s = row.original;
          if (s.status !== 'active') return <span className="text-muted-foreground">None</span>;
          const t = new Date(s.nextBillingDate).getTime();
          const soon = t - now < 2 * DAY;
          return <span className={cn('whitespace-nowrap', soon ? 'font-medium' : 'text-muted-foreground')}>{t - now < DAY && t - now > -DAY ? 'Today' : formatDate(s.nextBillingDate)}</span>;
        },
        meta: { title: 'Next billing' },
      },
      {
        id: 'spent',
        accessorFn: (s) => num(s.totalSpent),
        header: ({ column }) => <DataTableColumnHeader column={column} title="Spent so far" className="justify-end" />,
        enableGlobalFilter: false,
        cell: ({ row }) => <div className="text-right whitespace-nowrap text-muted-foreground tabular-nums">{formatGhs(num(row.original.totalSpent))}</div>,
        meta: { title: 'Spent so far', className: 'text-right' },
      },
      {
        id: 'since',
        accessorFn: (s) => new Date(s.createdAt).getTime(),
        header: ({ column }) => <DataTableColumnHeader column={column} title="Since" />,
        enableGlobalFilter: false,
        cell: ({ row }) => <span className="whitespace-nowrap text-muted-foreground">{formatDate(row.original.createdAt)}</span>,
        meta: { title: 'Since' },
      },
    ],
    [now],
  );

  const active = subs.filter((s) => s.status === 'active');
  const paused = subs.filter((s) => s.status === 'paused').length;
  // Same definition as Finance's MRR: active and not overdue.
  const mrr = active.filter((s) => new Date(s.nextBillingDate).getTime() >= now).reduce((t, s) => t + monthlyValue(s), 0);
  const failing = subs.filter(paymentFailing);
  const atRisk = failing.reduce((t, s) => t + monthlyValue(s), 0);
  const nextWeek = active.filter((s) => new Date(s.nextBillingDate).getTime() - now < 7 * DAY);
  const nextWeekValue = nextWeek.reduce((t, s) => t + basketValue(s), 0);
  const open = subs.find((s) => s.id === openId) ?? null;

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Subscriptions</h1>
        <p className="text-sm text-muted-foreground">Recurring baskets customers set up in the app, charged and delivered on their schedule.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active" value={String(active.length)} hint={`${paused} paused`} icon={Repeat} tint="bg-emerald-500/10 text-emerald-600" loading={loading} failed={!!error} />
        <StatCard label="Monthly recurring" value={formatGhs(mrr)} hint="Active baskets, converted to per month" icon={Wallet} tint="bg-violet-500/10 text-violet-600" loading={loading} failed={!!error} />
        <StatCard label="Billing in the next 7 days" value={String(nextWeek.length)} hint={`${formatGhs(nextWeekValue)} to charge`} icon={CalendarClock} tint="bg-sky-500/10 text-sky-600" loading={loading} failed={!!error} />
        <StatCard
          label="Payment failing"
          value={String(failing.length)}
          hint={failing.length ? `${formatGhs(atRisk)}/month at risk` : 'All recent charges went through'}
          icon={AlertTriangle}
          tint="bg-red-500/10 text-red-600"
          loading={loading}
          failed={!!error}
        />
      </div>

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="size-4" />
            Couldn’t load subscriptions: {error}
          </div>
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RotateCw />
            Retry
          </Button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={subs}
        isLoading={loading}
        getRowId={(s) => String(s.id)}
        initialSorting={[{ id: 'next', desc: false }]}
        initialHidden={{ since: false, payment: false }}
        searchPlaceholder="Search customer, phone or product…"
        filters={[
          { columnId: 'status', title: 'Status', options: STATUSES.map((s) => ({ value: s.value, label: s.label })) },
          {
            columnId: 'payment',
            title: 'Payment',
            options: [
              { value: 'failing', label: 'Failing' },
              { value: 'ok', label: 'OK' },
            ],
          },
          { columnId: 'frequency', title: 'Frequency', options: FREQUENCIES.map((f) => ({ value: f.value, label: f.label })) },
        ]}
        onRowClick={(s) => setOpenId(s.id)}
        toolbarActions={(table) => {
          const rows = table.getFilteredRowModel().rows.map((r) => r.original);
          return (
            <Button variant="outline" size="sm" className="h-8" disabled={!rows.length} onClick={() => exportCsv(rows)}>
              <Download />
              Export
            </Button>
          );
        }}
        emptyMessage={subs.length === 0 ? 'No subscriptions yet. Customers create them in the app.' : 'No subscriptions match.'}
      />

      {open && <SubscriptionSheet key={open.id} subscription={open} open={!!open} onOpenChange={(o) => !o && setOpenId(null)} onChanged={() => void load()} />}
    </div>
  );
}
