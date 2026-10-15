import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, Archive, ChevronDown, CircleAlert, CircleX, Download, Leaf, Package, RotateCw, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DataTable, type FilterConfig } from '@/components/data-table';
import { StatCard } from '@/components/stat-card';
import productsService from '../../services/productsService';
import ArchivedProductsDialog from './ArchivedProductsDialog';
import seasonalService from '../../services/seasonalService';
import { logger } from '../../utils/logger';
import { buildProductColumns } from './columns';
import ProductSheet, { type ProductSheetIntent } from './ProductSheet';
import { downloadProductsCsv } from './export-csv';
import SeasonalRotationDialog from './SeasonalRotationDialog';
import { STOCK_STATUSES, discountOf, stockMeta } from './product-meta';
import type { Product, ProductCategory } from './ProductTypes';

interface ProductsTabProps {
  products: Product[];
  categories: ProductCategory[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  patchProduct: (id: Product['id'], patch: Partial<Product>) => void;
}

const idNum = (p: Product) => Number.parseInt(String(p.id), 10);

export default function ProductsTab({ products, categories, loading, error, refresh, patchProduct }: ProductsTabProps) {
  const [archivedKey, setArchivedKey] = useState<number | null>(null);
  const [sheet, setSheet] = useState<{ id: string; intent: ProductSheetIntent; token: number } | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [seasonalOpen, setSeasonalOpen] = useState(false);

  // ?product=<id> (from search) opens that product once the list has loaded.
  const [params, setParams] = useSearchParams();
  const linked = params.get('product');
  useEffect(() => {
    if (!linked || loading) return;
    const t = setTimeout(() => {
      if (products.some((p) => String(p.id) === linked)) {
        setSheet({ id: linked, intent: 'view', token: Date.now() });
        setSheetOpen(true);
      }
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete('product');
          return next;
        },
        { replace: true },
      );
    }, 0);
    return () => clearTimeout(t);
  }, [linked, loading, products, setParams]);

  const sheetProduct = sheet ? (products.find((p) => String(p.id) === sheet.id) ?? null) : null;

  const columns = useMemo(() => {
    const open = (intent: ProductSheetIntent) => (p: Product) => {
      setSheet({ id: String(p.id), intent, token: Date.now() });
      setSheetOpen(intent !== 'archive');
    };
    return buildProductColumns({
      categories,
      onOpen: open('view'),
      onEdit: open('edit'),
      onArchive: open('archive'),
      onDiscount: async (p, discount) => {
        try {
          await productsService.update(idNum(p), { discount });
          patchProduct(p.id, { discount });
          toast.success(discount > 0 ? `${p.nameEnglish}: ${discount}% off` : `${p.nameEnglish}: discount removed`);
        } catch (err) {
          logger.error('❌ Failed to update discount:', err);
          toast.error(`Couldn't update the discount for ${p.nameEnglish}.`);
        }
      },
      onStock: async (p, stockStatus) => {
        const prev = p.stockStatus;
        patchProduct(p.id, { stockStatus });
        try {
          await productsService.update(idNum(p), { stockStatus });
          toast.success(`${p.nameEnglish} marked ${stockMeta(stockStatus).label.toLowerCase()}`);
        } catch (err) {
          patchProduct(p.id, { stockStatus: prev });
          logger.error('❌ Failed to update stock status:', err);
          toast.error(`Couldn't update stock for ${p.nameEnglish}.`);
        }
      },
      onSeasonal: async (p, seasonal) => {
        patchProduct(p.id, { seasonal });
        try {
          await seasonalService.toggleSeasonalStatus(idNum(p), seasonal);
        } catch (err) {
          patchProduct(p.id, { seasonal: !seasonal });
          logger.error('❌ Failed to toggle seasonal status:', err);
          toast.error(`Couldn't update seasonal status for ${p.nameEnglish}.`);
        }
      },
    });
  }, [categories, patchProduct]);

  const filters: FilterConfig[] = useMemo(
    () => [
      { columnId: 'category', title: 'Category', options: categories.map((c) => ({ value: c.id, label: c.name })) },
      { columnId: 'stock', title: 'Stock', options: STOCK_STATUSES.map(({ value, label, icon }) => ({ value, label, icon })) },
      {
        columnId: 'discount',
        title: 'Discount',
        options: [
          { value: 'discounted', label: 'On discount' },
          { value: 'full', label: 'Full price' },
        ],
      },
      {
        columnId: 'seasonal',
        title: 'Seasonal',
        options: [
          { value: 'seasonal', label: 'Seasonal' },
          { value: 'regular', label: 'Year-round' },
        ],
      },
    ],
    [categories],
  );

  const setStockFor = async (rows: Product[], stockStatus: string, clear: () => void) => {
    const results = await Promise.allSettled(rows.map((p) => productsService.update(idNum(p), { stockStatus })));
    let ok = 0;
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') {
        ok++;
        patchProduct(rows[i].id, { stockStatus });
      } else logger.error('❌ Bulk stock update failed for', rows[i].id, r.reason);
    });
    const label = stockMeta(stockStatus).label.toLowerCase();
    if (ok === rows.length) toast.success(`${ok} product${ok === 1 ? '' : 's'} marked ${label}`);
    else toast.error(`${ok} of ${rows.length} marked ${label}; the rest failed. Try them again.`);
    clear();
  };

  const counts = {
    out: products.filter((p) => p.stockStatus === 'out_of_stock').length,
    low: products.filter((p) => p.stockStatus === 'low_stock').length,
    discounted: products.filter((p) => discountOf(p) > 0).length,
    seasonal: products.filter((p) => p.seasonal).length,
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Live products"
          value={String(products.length)}
          hint="Visible in the app"
          icon={Package}
          tint="bg-sky-500/10 text-sky-600"
          loading={loading}
          failed={!!error}
        />
        <StatCard
          label="Out of stock"
          value={String(counts.out)}
          hint="Customers can’t order these"
          icon={CircleX}
          tint="bg-red-500/10 text-red-600"
          loading={loading}
          failed={!!error}
        />
        <StatCard label="Low stock" value={String(counts.low)} hint="Still orderable" icon={CircleAlert} tint="bg-amber-500/10 text-amber-600" loading={loading} failed={!!error} />
        <StatCard
          label="On discount"
          value={String(counts.discounted)}
          hint={`${counts.seasonal} seasonal`}
          icon={Sparkles}
          tint="bg-emerald-500/10 text-emerald-600"
          loading={loading}
          failed={!!error}
        />
      </div>

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="size-4" />
            Couldn’t load products: {error}
          </div>
          <Button variant="outline" size="sm" onClick={() => void refresh()}>
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
        searchPlaceholder="Search products…"
        filters={filters}
        onRowClick={(p) => {
          setSheet({ id: String(p.id), intent: 'view', token: Date.now() });
          setSheetOpen(true);
        }}
        emptyMessage={products.length === 0 ? 'No products yet. Add your first one.' : 'No products match these filters.'}
        toolbarActions={(table) => (
          <>
            {/* Exports what's shown: search and filters apply. */}
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              disabled={loading || products.length === 0}
              onClick={() => {
                const rows = table.getFilteredRowModel().rows.map((r) => r.original);
                downloadProductsCsv(rows, categories);
                toast.success(`Exported ${rows.length} product${rows.length === 1 ? '' : 's'}`);
              }}
            >
              <Download />
              Export
            </Button>
            <Button variant="outline" size="sm" className="h-8" onClick={() => setArchivedKey(Date.now())}>
              <Archive />
              Archived
            </Button>
            <Button variant="outline" size="sm" className="h-8" onClick={() => setSeasonalOpen(true)}>
              <Leaf />
              Seasonal
            </Button>
          </>
        )}
        bulkActions={(rows, clear) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                Set stock
                <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" side="top">
              <DropdownMenuLabel>Mark {rows.length} as…</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {STOCK_STATUSES.map((s) => (
                <DropdownMenuItem key={s.value} onSelect={() => void setStockFor(rows, s.value, clear)}>
                  <s.icon className={s.tone} />
                  {s.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />

      {sheet && sheetProduct && (
        <ProductSheet
          key={`${sheet.id}:${sheet.token}`}
          product={sheetProduct}
          intent={sheet.intent}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          categories={categories}
          onSaved={() => void refresh()}
          onArchived={() => {
            setSheet(null);
            void refresh();
          }}
        />
      )}

      <SeasonalRotationDialog open={seasonalOpen} onOpenChange={setSeasonalOpen} seasonalProducts={products.filter((p) => p.seasonal)} />
      {archivedKey && <ArchivedProductsDialog key={archivedKey} open={!!archivedKey} onOpenChange={(o) => !o && setArchivedKey(null)} onRestored={() => void refresh()} />}
    </div>
  );
}
