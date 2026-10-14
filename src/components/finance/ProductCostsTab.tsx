import React, { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { AlertCircle, CircleDollarSign, ImageOff, PackageX, Percent, RotateCw, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable, DataTableColumnHeader, facetedFilterFn } from '@/components/data-table';
import { StatCard } from '@/components/stat-card';
import { cn } from '@/lib/utils';
import productsService from '../../services/productsService';
import { logger } from '../../utils/logger';
import { formatGhs } from '../orders/order-status';
import { useCatalogData } from '../products/useCatalogData';
import { categoryIdOf, categoryNameOf, discountOf, num, priceOf, salePrice } from '../products/product-meta';
import type { Product, ProductCategory } from '../products/ProductTypes';

type Health = 'missing' | 'loss' | 'thin' | 'healthy';
const THIN = 15; // % — below this a margin is flagged as thin

const costOf = (p: Product): number | null => {
  const raw = (p as Product & { standardCost?: number | string | null }).standardCost;
  return raw == null || raw === '' ? null : num(raw);
};

function marginOf(p: Product) {
  const cost = costOf(p);
  if (cost == null) return null;
  const price = salePrice(p);
  const amount = price - cost;
  return { amount, pct: price > 0 ? (amount / price) * 100 : 0 };
}

function healthOf(p: Product): Health {
  const m = marginOf(p);
  if (!m) return 'missing';
  if (m.amount < 0) return 'loss';
  return m.pct < THIN ? 'thin' : 'healthy';
}

const HEALTH: Record<Health, { label: string; badge: string }> = {
  missing: { label: 'No cost', badge: 'bg-muted text-muted-foreground border-border' },
  loss: { label: 'Below cost', badge: 'bg-red-500/10 text-red-700 border-red-500/20' },
  thin: { label: `Thin (<${THIN}%)`, badge: 'bg-amber-500/10 text-amber-700 border-amber-500/20' },
  healthy: { label: 'Healthy', badge: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' },
};

// Saves on blur/Enter only when the value actually changed; empty clears the cost.
function CostCell({ product, onSave }: { product: Product; onSave: (cost: number | null) => Promise<void> }) {
  const current = costOf(product);
  const [draft, setDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const commit = async () => {
    if (draft === null) return;
    const value = draft.trim() === '' ? null : Number.parseFloat(draft);
    setDraft(null);
    if (value !== null && (!Number.isFinite(value) || value < 0)) {
      toast.error('Enter a cost of 0 or more, or leave it empty.');
      return;
    }
    if (value === current) return;
    setSaving(true);
    await onSave(value);
    setSaving(false);
  };

  return (
    <div className="relative w-28">
      <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-xs text-muted-foreground">₵</span>
      <Input
        type="number"
        min={0}
        step="0.01"
        inputMode="decimal"
        aria-label={`Purchase cost for ${product.nameEnglish}`}
        value={draft ?? (current == null ? '' : String(current))}
        placeholder="not set"
        disabled={saving}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => void commit()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
          if (e.key === 'Escape') {
            setDraft(null);
            e.currentTarget.blur();
          }
        }}
        className="h-8 pl-6 text-right tabular-nums"
      />
    </div>
  );
}

function buildColumns(categories: ProductCategory[], onSave: (p: Product, cost: number | null) => Promise<void>): ColumnDef<Product>[] {
  return [
    {
      id: 'product',
      accessorFn: (p) => `${p.nameEnglish} ${p.nameLocal ?? ''}`,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Product" />,
      sortingFn: (a, b) => a.original.nameEnglish.localeCompare(b.original.nameEnglish),
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex min-w-[180px] items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
            {row.original.imageUrl ? <img src={row.original.imageUrl} alt="" className="size-full object-cover" loading="lazy" /> : <ImageOff className="size-3.5 text-muted-foreground" />}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium">{row.original.nameEnglish}</p>
            <p className="truncate text-xs text-muted-foreground">{categoryNameOf(row.original, categories) || '—'}</p>
          </div>
        </div>
      ),
      meta: { title: 'Product' },
    },
    {
      id: 'category',
      accessorFn: (p) => categoryIdOf(p),
      header: 'Category',
      filterFn: facetedFilterFn,
      enableGlobalFilter: false,
      cell: ({ row }) => categoryNameOf(row.original, categories) || '—',
      meta: { title: 'Category' },
    },
    {
      id: 'price',
      accessorFn: (p) => salePrice(p),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Sells for" className="justify-end" />,
      enableGlobalFilter: false,
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="text-right whitespace-nowrap tabular-nums">
            {discountOf(p) > 0 && <div className="text-xs text-muted-foreground line-through">{formatGhs(priceOf(p))}</div>}
            {formatGhs(salePrice(p))}
            <span className="text-xs text-muted-foreground"> / {p.unitType}</span>
          </div>
        );
      },
      meta: { title: 'Sells for', className: 'text-right' },
    },
    {
      id: 'cost',
      accessorFn: (p) => costOf(p) ?? -1,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Purchase cost" />,
      enableGlobalFilter: false,
      cell: ({ row }) => <CostCell product={row.original} onSave={(c) => onSave(row.original, c)} />,
      meta: { title: 'Purchase cost' },
    },
    {
      id: 'margin',
      accessorFn: (p) => marginOf(p)?.pct ?? Number.NEGATIVE_INFINITY,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Margin" className="justify-end" />,
      enableGlobalFilter: false,
      cell: ({ row }) => {
        const m = marginOf(row.original);
        if (!m) return <div className="text-right text-muted-foreground">—</div>;
        return (
          <div className={cn('text-right whitespace-nowrap tabular-nums', m.amount < 0 ? 'text-red-600' : m.pct < THIN ? 'text-amber-600' : 'text-emerald-700')}>
            <span className="font-medium">{m.pct.toFixed(0)}%</span>
            <span className="ml-1.5 text-xs opacity-80">{formatGhs(m.amount)}</span>
          </div>
        );
      },
      meta: { title: 'Margin', className: 'text-right' },
    },
    {
      id: 'health',
      accessorFn: (p) => healthOf(p),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      filterFn: facetedFilterFn,
      enableGlobalFilter: false,
      cell: ({ row }) => {
        const h = HEALTH[healthOf(row.original)];
        return (
          <Badge variant="outline" className={cn('font-medium', h.badge)}>
            {h.label}
          </Badge>
        );
      },
      meta: { title: 'Status' },
    },
  ];
}

const ProductCostsTab: React.FC = () => {
  const { products, categories, loading, error, refreshProducts, patchProduct } = useCatalogData();

  const columns = useMemo(
    () =>
      buildColumns(categories, async (p, cost) => {
        try {
          // null clears the cost (the API accepts it; undefined would be ignored).
          await productsService.update(Number(p.id), { standardCost: cost } as unknown as Parameters<typeof productsService.update>[1]);
          patchProduct(p.id, { standardCost: cost } as Partial<Product>);
          toast.success(cost == null ? `Cost cleared for ${p.nameEnglish}` : `${p.nameEnglish}: cost ${formatGhs(cost)}`);
        } catch (err) {
          logger.error('Failed to save product cost:', err);
          toast.error(`Couldn't save the cost for ${p.nameEnglish}.`);
        }
      }),
    [categories, patchProduct],
  );

  const costed = products.filter((p) => costOf(p) != null);
  const margins = costed.map((p) => marginOf(p)!);
  const revenue = costed.reduce((s, p) => s + salePrice(p), 0);
  const avgPct = revenue > 0 ? (margins.reduce((s, m) => s + m.amount, 0) / revenue) * 100 : 0;
  const losses = products.filter((p) => healthOf(p) === 'loss').length;

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        What you currently pay for each product. It’s used for profit and P&L whenever no actual purchase price has been logged, so
        products without a cost make those numbers less accurate.
      </p>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Costs set" value={`${costed.length} / ${products.length}`} hint="Live products" icon={CircleDollarSign} tint="bg-sky-500/10 text-sky-600" loading={loading} failed={!!error} />
        <StatCard label="Missing a cost" value={String(products.length - costed.length)} hint="Profit falls back to an estimate" icon={PackageX} tint="bg-amber-500/10 text-amber-600" loading={loading} failed={!!error} />
        <StatCard label="Average margin" value={costed.length ? `${avgPct.toFixed(1)}%` : '—'} hint="Across costed products, at today’s prices" icon={Percent} tint="bg-emerald-500/10 text-emerald-600" loading={loading} failed={!!error} />
        <StatCard label="Selling below cost" value={String(losses)} hint={losses ? 'Each sale loses money' : 'None'} icon={TrendingDown} tint="bg-red-500/10 text-red-600" loading={loading} failed={!!error} />
      </div>

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="size-4" />
            Couldn’t load products: {error}
          </div>
          <Button variant="outline" size="sm" onClick={() => void refreshProducts()}>
            <RotateCw />
            Retry
          </Button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={products}
        isLoading={loading}
        getRowId={(p) => String(p.id)}
        initialSorting={[{ id: 'product', desc: false }]}
        initialHidden={{ category: false }}
        searchPlaceholder="Search products…"
        filters={[
          { columnId: 'health', title: 'Status', options: (Object.keys(HEALTH) as Health[]).map((h) => ({ value: h, label: HEALTH[h].label })) },
          { columnId: 'category', title: 'Category', options: categories.map((c) => ({ value: c.id, label: c.name })) },
        ]}
        emptyMessage={products.length === 0 ? 'No products yet.' : 'No products match these filters.'}
      />
    </div>
  );
};

export default ProductCostsTab;
