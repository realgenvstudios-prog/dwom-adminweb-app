import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { AlertCircle, Download, Megaphone, Plus, Radio, RotateCw, ShoppingBag, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, DataTableColumnHeader, facetedFilterFn } from '@/components/data-table';
import { StatCard } from '@/components/stat-card';
import marketingService, { type Campaign } from '../../services/marketingService';
import ridersService, { type Zone } from '../../services/ridersService';
import { logger } from '../../utils/logger';
import { formatDate } from '../customers/CustomerTypes';
import { formatGhs } from '../orders/order-status';
import CampaignDialog from './CampaignDialog';
import CampaignSheet from './CampaignSheet';
import { CHANNELS, STATUSES, channelOf, num, statusOf } from './campaign-meta';

const csvCell = (v: unknown) => {
  const s = String(v ?? '');
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

function exportCsv(rows: Campaign[]) {
  const header = ['Name', 'Channel', 'Status', 'Start', 'End', 'Delivered / reach', 'Orders', 'Orders estimated', 'Revenue (GHS)', 'Spend (GHS)'];
  const lines = rows.map((c) =>
    [
      c.name,
      channelOf(c.channel).label,
      statusOf(c.status).label,
      c.startDate.slice(0, 10),
      c.endDate?.slice(0, 10) ?? '',
      c.impressions,
      c.conversions,
      c.metricsAreEstimate ? 'yes' : 'no',
      c.metricsAreEstimate ? '' : c.revenue,
      num(c.actualSpend),
    ]
      .map(csvCell)
      .join(','),
  );
  const blob = new Blob([[header.join(','), ...lines].join('\n')], {
    type: 'text/csv;charset=utf-8',
  });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `campaigns-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function CampaignsTab() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const [dialog, setDialog] = useState<{
    campaign: Campaign | null;
    token: number;
  } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      setCampaigns(await marketingService.getCampaigns());
    } catch (err) {
      logger.error('Failed to load campaigns:', err);
      setError(err instanceof Error ? err.message : 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    ridersService
      .getAllZones()
      .then(setZones)
      .catch((err) => logger.error('Failed to load zones:', err));
    return () => clearTimeout(t);
  }, [load]);

  const openDialog = useCallback((campaign: Campaign | null) => {
    setDialog({ campaign, token: Date.now() });
    setDialogOpen(true);
  }, []);

  const columns = useMemo<ColumnDef<Campaign>[]>(
    () => [
      {
        id: 'name',
        accessorFn: (c) => `${c.name} ${c.title ?? ''} ${c.content}`,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Campaign" />,
        sortingFn: (a, b) => a.original.name.localeCompare(b.original.name),
        cell: ({ row }) => (
          <div className="max-w-[320px] min-w-[180px]">
            <p className="truncate font-medium">{row.original.name}</p>
            <p className="truncate text-xs text-muted-foreground">{row.original.title || row.original.content}</p>
          </div>
        ),
        meta: { title: 'Campaign' },
      },
      {
        id: 'channel',
        accessorKey: 'channel',
        header: 'Channel',
        filterFn: facetedFilterFn,
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => {
          const ch = channelOf(row.original.channel);
          return (
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-muted-foreground">
              <ch.icon className="size-3.5" />
              {ch.label}
            </span>
          );
        },
        meta: { title: 'Channel' },
      },
      {
        id: 'status',
        accessorKey: 'status',
        header: 'Status',
        filterFn: facetedFilterFn,
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => {
          const s = statusOf(row.original.status);
          return (
            <Badge variant="outline" className={s.className}>
              {s.label}
            </Badge>
          );
        },
        meta: { title: 'Status' },
      },
      {
        id: 'start',
        accessorFn: (c) => new Date(c.startDate).getTime(),
        header: ({ column }) => <DataTableColumnHeader column={column} title="Start" />,
        enableGlobalFilter: false,
        cell: ({ row }) => <span className="whitespace-nowrap text-muted-foreground">{formatDate(row.original.startDate)}</span>,
        meta: { title: 'Start' },
      },
      {
        id: 'delivered',
        accessorKey: 'impressions',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Delivered" className="justify-end" />,
        enableGlobalFilter: false,
        cell: ({ row }) => <div className="text-right tabular-nums">{row.original.status === 'draft' ? 'Not sent' : row.original.impressions.toLocaleString()}</div>,
        meta: { title: 'Delivered', className: 'text-right' },
      },
      {
        id: 'orders',
        accessorKey: 'conversions',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Orders" className="justify-end" />,
        enableGlobalFilter: false,
        cell: ({ row }) => (
          <div className="text-right whitespace-nowrap tabular-nums">
            {row.original.status === 'draft' ? 'Not sent' : row.original.conversions.toLocaleString()}
            {row.original.status !== 'draft' && row.original.metricsAreEstimate && row.original.conversions > 0 && (
              <span className="ml-1 text-xs text-muted-foreground" title="Entered by hand. No orders credited yet">
                est.
              </span>
            )}
          </div>
        ),
        meta: { title: 'Orders', className: 'text-right' },
      },
      {
        id: 'revenue',
        accessorFn: (c) => (c.metricsAreEstimate ? 0 : c.revenue),
        header: ({ column }) => <DataTableColumnHeader column={column} title="Revenue" className="justify-end" />,
        enableGlobalFilter: false,
        cell: ({ row }) => (
          <div className="text-right font-medium whitespace-nowrap tabular-nums">{row.original.metricsAreEstimate ? 'Not tracked' : formatGhs(row.original.revenue)}</div>
        ),
        meta: { title: 'Revenue', className: 'text-right' },
      },
      {
        id: 'spend',
        accessorFn: (c) => num(c.actualSpend),
        header: ({ column }) => <DataTableColumnHeader column={column} title="Spend" className="justify-end" />,
        enableGlobalFilter: false,
        cell: ({ row }) => (
          <div className="text-right whitespace-nowrap text-muted-foreground tabular-nums">{num(row.original.actualSpend) ? formatGhs(num(row.original.actualSpend)) : 'None'}</div>
        ),
        meta: { title: 'Spend', className: 'text-right' },
      },
      {
        id: 'code',
        accessorFn: (c) => c.Coupon?.map((k) => k.code).join(' ') ?? '',
        header: 'Code',
        enableSorting: false,
        cell: ({ row }) => {
          const k = row.original.Coupon?.[0];
          return k ? <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{k.code}</code> : <span className="text-muted-foreground">None</span>;
        },
        meta: { title: 'Code' },
      },
    ],
    [],
  );

  const live = campaigns.filter((c) => c.status === 'active');
  const launched = campaigns.filter((c) => c.status !== 'draft');
  const delivered = launched.reduce((s, c) => s + c.impressions, 0);
  const tracked = campaigns.filter((c) => !c.metricsAreEstimate);
  const orders = tracked.reduce((s, c) => s + c.conversions, 0);
  const revenue = tracked.reduce((s, c) => s + c.revenue, 0);
  const spend = campaigns.reduce((s, c) => s + num(c.actualSpend), 0);
  const drafts = campaigns.length - launched.length;
  const open = campaigns.find((c) => c.id === openId) ?? null;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Live campaigns"
          value={String(live.length)}
          hint={drafts ? `${drafts} draft${drafts === 1 ? '' : 's'} waiting` : 'No drafts waiting'}
          icon={Radio}
          tint="bg-emerald-500/10 text-emerald-600"
          loading={loading}
          failed={!!error}
        />
        <StatCard
          label="Messages delivered"
          value={delivered.toLocaleString()}
          hint="Across every launched campaign"
          icon={Megaphone}
          tint="bg-sky-500/10 text-sky-600"
          loading={loading}
          failed={!!error}
        />
        <StatCard
          label="Orders from campaigns"
          value={orders.toLocaleString()}
          hint="Paid orders credited automatically"
          icon={ShoppingBag}
          tint="bg-violet-500/10 text-violet-600"
          loading={loading}
          failed={!!error}
        />
        <StatCard
          label="Revenue from campaigns"
          value={formatGhs(revenue)}
          hint={spend > 0 ? `${(revenue / spend).toFixed(1)}× the ${formatGhs(spend)} spent` : 'No spend recorded yet'}
          icon={TrendingUp}
          tint="bg-amber-500/10 text-amber-600"
          loading={loading}
          failed={!!error}
        />
      </div>

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="size-4" />
            Couldn’t load campaigns: {error}
          </div>
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RotateCw />
            Retry
          </Button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={campaigns}
        isLoading={loading}
        getRowId={(c) => String(c.id)}
        initialSorting={[{ id: 'start', desc: true }]}
        initialHidden={{ code: false }}
        searchPlaceholder="Search campaigns…"
        filters={[
          {
            columnId: 'status',
            title: 'Status',
            options: STATUSES.map((s) => ({ value: s.value, label: s.label })),
          },
          {
            columnId: 'channel',
            title: 'Channel',
            options: CHANNELS.map((c) => ({ value: c.value, label: c.label })),
          },
        ]}
        onRowClick={(c) => setOpenId(c.id)}
        toolbarActions={(table) => {
          const rows = table.getFilteredRowModel().rows.map((r) => r.original);
          return (
            <>
              <Button variant="outline" size="sm" className="h-8" disabled={!rows.length} onClick={() => exportCsv(rows)}>
                <Download />
                Export
              </Button>
              <Button size="sm" className="h-8" onClick={() => openDialog(null)}>
                <Plus />
                New campaign
              </Button>
            </>
          );
        }}
        emptyMessage={campaigns.length === 0 ? 'No campaigns yet. Create one to reach your customers.' : 'No campaigns match.'}
      />

      {open && (
        <CampaignSheet
          key={`${open.id}-${open.updatedAt}`}
          campaign={open}
          zones={zones}
          open={!!open}
          onOpenChange={(o) => !o && setOpenId(null)}
          onEdit={(c) => {
            setOpenId(null);
            openDialog(c);
          }}
          onChanged={() => void load()}
        />
      )}
      {dialog && <CampaignDialog key={dialog.token} campaign={dialog.campaign} open={dialogOpen} onOpenChange={setDialogOpen} onSaved={() => void load()} />}
    </div>
  );
}
