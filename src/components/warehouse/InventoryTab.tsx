import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Boxes, Download, Info, Loader2, PackagePlus, RotateCw, TriangleAlert, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DataTable } from '@/components/data-table';
import { StatCard } from '@/components/stat-card';
import inventoryService, { type InventoryStats } from '../../services/inventoryService';
import { logger } from '../../utils/logger';
import { formatGhs } from '../orders/order-status';
import InventoryItemSheet from './InventoryItemSheet';
import StockDialog, { type StockAction } from './StockDialogs';
import { buildInventoryColumns } from './columns';
import { LEVELS, levelOf, type InventoryRow } from './inventory-meta';

function csvCell(v: string | number) {
  let s = String(v);
  if (typeof v === 'string' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadCsv(rows: InventoryRow[]) {
  const header = ['Product ID', 'Product', 'Category', 'On hand', 'Unit', 'Reorder at', 'Reorder quantity', 'Level', 'Last restocked', 'Product status'];
  const lines = rows.map((r) => [
    r.productId,
    r.Product?.nameEnglish ?? '',
    r.Product?.Category?.name ?? '',
    r.quantity,
    r.Product?.unitType ?? '',
    r.reorderLevel,
    r.reorderQuantity,
    LEVELS[levelOf(r)].label,
    r.lastRestockedAt ?? '',
    r.Product?.active === false ? 'Archived' : 'Live',
  ]);
  const csv = [header, ...lines].map((l) => l.map(csvCell).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `dwom-inventory-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function BulkReceive({ rows, onDone }: { rows: InventoryRow[]; onDone: () => void }) {
  const [qty, setQty] = useState('10');
  const [busy, setBusy] = useState(false);
  const run = async () => {
    const n = Number.parseInt(qty, 10);
    if (!(n >= 1)) return;
    setBusy(true);
    const results = await Promise.allSettled(rows.map((r) => inventoryService.restock(r.productId, { quantity: n })));
    const ok = results.filter((r) => r.status === 'fulfilled').length;
    results.forEach((r, i) => r.status === 'rejected' && logger.error('Bulk receive failed for', rows[i].productId, r.reason));
    if (ok === rows.length) toast.success(`Received ${n} each for ${ok} product${ok === 1 ? '' : 's'}`);
    else toast.error(`Received for ${ok} of ${rows.length}; the rest failed — try them again.`);
    setBusy(false);
    onDone();
  };
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline">
          <PackagePlus />
          Receive stock
        </Button>
      </PopoverTrigger>
      <PopoverContent side="top" className="w-64">
        <div className="grid gap-2">
          <p className="text-sm font-medium">Add to each of {rows.length}</p>
          <Input type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} />
          <Button size="sm" onClick={() => void run()} disabled={busy}>
            {busy && <Loader2 className="animate-spin" />}
            Receive
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function InventoryTab() {
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewId, setViewId] = useState<number | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [dialog, setDialog] = useState<{ id: number; action: StockAction; token: number } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [list, s] = await Promise.all([inventoryService.getAll(), inventoryService.getStats()]);
      setRows((list ?? []) as unknown as InventoryRow[]);
      setStats(s);
    } catch (err) {
      logger.error('Failed to load inventory:', err);
      setError(err instanceof Error ? err.message : 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  const openAction = useCallback((row: InventoryRow, action: StockAction | 'history') => {
    if (action === 'history') {
      setViewId(row.id);
      setViewOpen(true);
      return;
    }
    setDialog({ id: row.id, action, token: Date.now() });
    setDialogOpen(true);
  }, []);

  const columns = useMemo(() => buildInventoryColumns(openAction), [openAction]);
  const viewing = rows.find((r) => r.id === viewId) ?? null;
  const dialogRow = dialog ? rows.find((r) => r.id === dialog.id) ?? null : null;

  return (
    <div className="flex flex-col gap-6">
      <p className="flex items-start gap-2 rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" />
        <span>
          Warehouse counts track stock you hold. They don’t control what customers can buy — that’s each product’s{' '}
          <strong className="text-foreground">stock status</strong> in Catalog.
        </span>
      </p>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Units on hand" value={(stats?.totalUnits ?? 0).toLocaleString()} hint={`${stats?.totalProducts ?? 0} products tracked`} icon={Boxes} tint="bg-sky-500/10 text-sky-600" loading={loading} failed={!!error} />
        <StatCard
          label="Need reordering"
          value={String(stats?.lowStockItems ?? 0)}
          hint={`${stats?.outOfStockItems ?? 0} empty`}
          icon={TriangleAlert}
          tint="bg-amber-500/10 text-amber-600"
          loading={loading}
          failed={!!error}
        />
        <StatCard label="Stock value" value={formatGhs(stats?.totalInventoryValue)} hint="At selling price" icon={Wallet} tint="bg-emerald-500/10 text-emerald-600" loading={loading} failed={!!error} />
        <StatCard label="Cost basis" value={formatGhs(stats?.totalInventoryCostBasis)} hint="At purchase cost, where set" icon={Wallet} tint="bg-violet-500/10 text-violet-600" loading={loading} failed={!!error} />
      </div>

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="size-4" />
            Couldn’t load inventory: {error}
          </div>
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RotateCw />
            Retry
          </Button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={rows}
        isLoading={loading}
        getRowId={(r) => String(r.id)}
        initialSorting={[{ id: 'product', desc: false }]}
        initialHidden={{ status: false }}
        searchPlaceholder="Search products…"
        filters={[
          { columnId: 'level', title: 'Level', options: (Object.keys(LEVELS) as (keyof typeof LEVELS)[]).map((k) => ({ value: k, label: LEVELS[k].label, icon: LEVELS[k].icon })) },
          {
            columnId: 'status',
            title: 'Product',
            options: [
              { value: 'live', label: 'Live' },
              { value: 'archived', label: 'Archived' },
            ],
          },
        ]}
        onRowClick={(r) => {
          setViewId(r.id);
          setViewOpen(true);
        }}
        emptyMessage={rows.length === 0 ? 'No products are tracked in the warehouse yet.' : 'Nothing matches these filters.'}
        toolbarActions={(table) => (
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            disabled={loading || rows.length === 0}
            onClick={() => downloadCsv(table.getFilteredRowModel().rows.map((r) => r.original))}
          >
            <Download />
            Export
          </Button>
        )}
        bulkActions={(selected, clear) => (
          <BulkReceive
            rows={selected}
            onDone={() => {
              clear();
              void load();
            }}
          />
        )}
      />

      {viewing && (
        <InventoryItemSheet key={viewing.id} row={viewing} open={viewOpen} onOpenChange={setViewOpen} onAction={(action) => openAction(viewing, action)} />
      )}

      {dialog && dialogRow && (
        <StockDialog key={dialog.token} row={dialogRow} action={dialog.action} open={dialogOpen} onOpenChange={setDialogOpen} onDone={() => void load()} />
      )}
    </div>
  );
}
