import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { AlertCircle, CalendarClock, Download, Link2, Plus, RotateCw, Ticket, TicketCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, DataTableColumnHeader, facetedFilterFn } from '@/components/data-table';
import { StatCard } from '@/components/stat-card';
import couponService, { type Coupon } from '../../services/couponService';
import marketingService, { type Campaign } from '../../services/marketingService';
import { logger } from '../../utils/logger';
import { formatDate } from '../customers/CustomerTypes';
import { formatGhs } from '../orders/order-status';
import { num } from './campaign-meta';
import { COUPON_STATES, couponState, discountLabel, stateOf } from './coupon-meta';
import CouponDialog from './CouponDialog';
import CouponSheet from './CouponSheet';

const WEEK = 7 * 24 * 60 * 60 * 1000;

const csvCell = (v: unknown) => {
  const s = String(v ?? '');
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

function exportCsv(rows: Coupon[], campaignName: (id?: number | null) => string) {
  const header = ['Code', 'Discount', 'Status', 'Times used', 'Total limit', 'Per customer', 'Minimum order (GHS)', 'Valid until', 'Campaign', 'Note'];
  const lines = rows.map((c) =>
    [
      c.code,
      discountLabel(c),
      stateOf(couponState(c)).label,
      c.usageCount,
      c.maxUses ?? '',
      c.usagePerUser,
      num(c.minOrderAmount),
      c.expiresAt?.slice(0, 10) ?? '',
      campaignName(c.campaignId),
      c.description ?? '',
    ]
      .map(csvCell)
      .join(','),
  );
  const blob = new Blob([[header.join(','), ...lines].join('\n')], {
    type: 'text/csv;charset=utf-8',
  });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `discount-codes-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function CouponsTab() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const [dialog, setDialog] = useState<{
    coupon: Coupon | null;
    token: number;
  } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [now] = useState(() => Date.now());

  const load = useCallback(async () => {
    try {
      setError(null);
      setCoupons(await couponService.getAll(true));
    } catch (err) {
      logger.error('Failed to load discount codes:', err);
      setError(err instanceof Error ? err.message : 'Failed to load discount codes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    marketingService
      .getCampaigns()
      .then(setCampaigns)
      .catch((err) => logger.error('Failed to load campaigns:', err));
    return () => clearTimeout(t);
  }, [load]);

  const campaignName = useCallback((id?: number | null) => (id ? (campaigns.find((c) => c.id === id)?.name ?? `Campaign #${id}`) : ''), [campaigns]);

  const openDialog = (coupon: Coupon | null) => {
    setDialog({ coupon, token: Date.now() });
    setDialogOpen(true);
  };

  const columns = useMemo<ColumnDef<Coupon>[]>(
    () => [
      {
        id: 'code',
        accessorFn: (c) => `${c.code} ${c.description ?? ''}`,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Code" />,
        sortingFn: (a, b) => a.original.code.localeCompare(b.original.code),
        cell: ({ row }) => (
          <div className="max-w-[260px] min-w-[140px]">
            <code className="font-mono font-medium tracking-wider">{row.original.code}</code>
            {row.original.description && <p className="truncate text-xs text-muted-foreground">{row.original.description}</p>}
          </div>
        ),
        meta: { title: 'Code' },
      },
      {
        id: 'discount',
        accessorFn: (c) => num(c.discountValue),
        header: 'Discount',
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => (
          <div className="whitespace-nowrap">
            <p className="font-medium">{discountLabel(row.original)}</p>
            {num(row.original.minOrderAmount) > 0 && <p className="text-xs text-muted-foreground">from {formatGhs(num(row.original.minOrderAmount))}</p>}
          </div>
        ),
        meta: { title: 'Discount' },
      },
      {
        id: 'state',
        accessorFn: (c) => couponState(c, now),
        header: 'Status',
        filterFn: facetedFilterFn,
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => {
          const s = stateOf(couponState(row.original, now));
          return (
            <Badge variant="outline" className={s.className}>
              {s.label}
            </Badge>
          );
        },
        meta: { title: 'Status' },
      },
      {
        id: 'uses',
        accessorKey: 'usageCount',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Used" />,
        enableGlobalFilter: false,
        cell: ({ row }) => {
          const { usageCount, maxUses } = row.original;
          return (
            <div className="w-28">
              <p className="text-sm tabular-nums">
                {usageCount.toLocaleString()}
                <span className="text-muted-foreground">{maxUses != null ? ` / ${maxUses.toLocaleString()}` : ''}</span>
              </p>
              {maxUses != null && (
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${Math.min(100, (usageCount / Math.max(1, maxUses)) * 100)}%`,
                    }}
                  />
                </div>
              )}
            </div>
          );
        },
        meta: { title: 'Used' },
      },
      {
        id: 'expires',
        accessorFn: (c) => (c.expiresAt ? new Date(c.expiresAt).getTime() : Number.MAX_SAFE_INTEGER),
        header: ({ column }) => <DataTableColumnHeader column={column} title="Valid until" />,
        enableGlobalFilter: false,
        cell: ({ row }) => {
          const exp = row.original.expiresAt;
          if (!exp) return <span className="text-muted-foreground">No end</span>;
          const soon = new Date(exp).getTime() - now < WEEK && new Date(exp).getTime() > now;
          return <span className={soon ? 'whitespace-nowrap text-amber-700' : 'whitespace-nowrap text-muted-foreground'}>{formatDate(exp)}</span>;
        },
        meta: { title: 'Valid until' },
      },
      {
        id: 'campaign',
        accessorFn: (c) => (c.campaignId ? 'linked' : 'none'),
        header: 'Campaign',
        filterFn: facetedFilterFn,
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) =>
          row.original.campaignId ? (
            <span className="inline-flex max-w-[180px] items-center gap-1.5 text-sm">
              <Link2 className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{campaignName(row.original.campaignId)}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
        meta: { title: 'Campaign' },
      },
    ],
    [campaignName, now],
  );

  const live = coupons.filter((c) => couponState(c, now) === 'active');
  const uses = coupons.reduce((s, c) => s + c.usageCount, 0);
  const linked = coupons.filter((c) => c.campaignId).length;
  const expiringSoon = live.filter((c) => c.expiresAt && new Date(c.expiresAt).getTime() - now < WEEK).length;
  const open = coupons.find((c) => c.id === openId) ?? null;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Working codes"
          value={String(live.length)}
          hint={`${coupons.length - live.length} paused, expired or used up`}
          icon={TicketCheck}
          tint="bg-emerald-500/10 text-emerald-600"
          loading={loading}
          failed={!!error}
        />
        <StatCard label="Times used" value={uses.toLocaleString()} hint="Across every code" icon={Ticket} tint="bg-sky-500/10 text-sky-600" loading={loading} failed={!!error} />
        <StatCard
          label="Linked to a campaign"
          value={String(linked)}
          hint="Their orders count toward the campaign"
          icon={Link2}
          tint="bg-violet-500/10 text-violet-600"
          loading={loading}
          failed={!!error}
        />
        <StatCard
          label="Ending this week"
          value={String(expiringSoon)}
          hint="Working codes that expire within 7 days"
          icon={CalendarClock}
          tint="bg-amber-500/10 text-amber-600"
          loading={loading}
          failed={!!error}
        />
      </div>

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="size-4" />
            Couldn’t load discount codes: {error}
          </div>
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RotateCw />
            Retry
          </Button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={coupons}
        isLoading={loading}
        getRowId={(c) => String(c.id)}
        initialSorting={[{ id: 'uses', desc: true }]}
        searchPlaceholder="Search codes or notes…"
        filters={[
          {
            columnId: 'state',
            title: 'Status',
            options: COUPON_STATES.map((s) => ({
              value: s.value,
              label: s.label,
            })),
          },
          {
            columnId: 'campaign',
            title: 'Campaign',
            options: [
              { value: 'linked', label: 'Linked' },
              { value: 'none', label: 'Not linked' },
            ],
          },
        ]}
        onRowClick={(c) => setOpenId(c.id)}
        toolbarActions={(table) => {
          const rows = table.getFilteredRowModel().rows.map((r) => r.original);
          return (
            <>
              <Button variant="outline" size="sm" className="h-8" disabled={!rows.length} onClick={() => exportCsv(rows, campaignName)}>
                <Download />
                Export
              </Button>
              <Button size="sm" className="h-8" onClick={() => openDialog(null)}>
                <Plus />
                New code
              </Button>
            </>
          );
        }}
        emptyMessage={coupons.length === 0 ? 'No discount codes yet.' : 'No codes match.'}
      />

      {open && (
        <CouponSheet
          key={`${open.id}-${open.updatedAt}`}
          coupon={open}
          campaign={campaigns.find((c) => c.id === open.campaignId) ?? null}
          open={!!open}
          onOpenChange={(o) => !o && setOpenId(null)}
          onEdit={(c) => {
            setOpenId(null);
            openDialog(c);
          }}
          onChanged={() => void load()}
        />
      )}
      {dialog && <CouponDialog key={dialog.token} coupon={dialog.coupon} campaigns={campaigns} open={dialogOpen} onOpenChange={setDialogOpen} onSaved={() => void load()} />}
    </div>
  );
}
