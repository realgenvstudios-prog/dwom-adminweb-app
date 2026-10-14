import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { AlertCircle, MapPin, MoreHorizontal, Package, Pencil, Plus, Power, ReceiptText, RotateCw, Trash2, Truck } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTable, DataTableColumnHeader, facetedFilterFn } from '@/components/data-table';
import { StatCard } from '@/components/stat-card';
import suppliersService, { type Supplier } from '../../services/suppliersService';
import productsService, { type Product } from '../../services/productsService';
import { logger } from '../../utils/logger';
import { initialsOf } from '../customers/CustomerTypes';
import SupplierSheet from '../suppliers/SupplierSheet';

// Who DWOM buys from and which products each supplies — independent of
// logging a purchase (product cost lives in Finance › Product Costs).
export default function SuppliersTab() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sheet, setSheet] = useState<{ supplier: Supplier | null; token: number } | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [toRemove, setToRemove] = useState<Supplier | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setSuppliers((await suppliersService.getAll(true)) ?? []);
    } catch (err) {
      logger.error('Failed to load suppliers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      void load();
      productsService
        .getAll()
        .then((p) => setProducts(p ?? []))
        .catch((err) => logger.error('Failed to load products for suppliers:', err));
    }, 0);
    return () => clearTimeout(t);
  }, [load]);

  const openSheet = useCallback((supplier: Supplier | null) => {
    setSheet({ supplier, token: Date.now() });
    setSheetOpen(true);
  }, []);

  const reactivate = useCallback(
    async (s: Supplier) => {
      try {
        await suppliersService.update(s.id, { active: true });
        toast.success(`${s.name} reactivated`);
        await load();
      } catch (err) {
        logger.error('Failed to reactivate supplier:', err);
        toast.error(`Couldn't reactivate ${s.name}.`);
      }
    },
    [load],
  );

  const confirmRemove = async () => {
    const s = toRemove;
    if (!s) return;
    try {
      const res = await suppliersService.remove(s.id);
      toast.success(res?.deleted ? `${s.name} deleted` : `${s.name} has purchase history, so it was deactivated instead`);
      await load();
    } catch (err) {
      logger.error('Failed to remove supplier:', err);
      toast.error(`Couldn't remove ${s.name}.`);
    } finally {
      setToRemove(null);
    }
  };

  const columns = useMemo<ColumnDef<Supplier>[]>(
    () => [
      {
        id: 'supplier',
        accessorFn: (s) => `${s.name} ${s.contactName ?? ''} ${s.phone ?? ''} ${s.location ?? ''}`,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Supplier" />,
        sortingFn: (a, b) => a.original.name.localeCompare(b.original.name),
        enableHiding: false,
        cell: ({ row }) => {
          const s = row.original;
          return (
            <div className={`flex min-w-[180px] items-center gap-3 ${s.active ? '' : 'opacity-60'}`}>
              <Avatar className="size-9">
                <AvatarFallback className="text-xs">{initialsOf(s.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-medium">{s.name}</p>
                <p className="truncate text-xs text-muted-foreground tabular-nums">{[s.contactName, s.phone].filter(Boolean).join(' · ') || 'No contact details'}</p>
              </div>
            </div>
          );
        },
        meta: { title: 'Supplier' },
      },
      {
        id: 'location',
        accessorFn: (s) => s.location ?? '',
        header: 'Location',
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) =>
          row.original.location ? (
            <span className="flex max-w-[220px] items-center gap-1.5 truncate text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" />
              {row.original.location}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
        meta: { title: 'Location' },
      },
      {
        id: 'products',
        accessorFn: (s) => s.productCount ?? 0,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Products" className="justify-end" />,
        enableGlobalFilter: false,
        cell: ({ row }) => <div className="text-right tabular-nums">{row.original.productCount ?? 0}</div>,
        meta: { title: 'Products', className: 'text-right' },
      },
      {
        id: 'purchases',
        accessorFn: (s) => s.procurementCount ?? 0,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Purchases" className="justify-end" />,
        enableGlobalFilter: false,
        cell: ({ row }) => <div className="text-right tabular-nums">{row.original.procurementCount ?? 0}</div>,
        meta: { title: 'Purchases', className: 'text-right' },
      },
      {
        id: 'status',
        accessorFn: (s) => (s.active ? 'active' : 'inactive'),
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        filterFn: facetedFilterFn,
        enableGlobalFilter: false,
        cell: ({ row }) =>
          row.original.active ? (
            <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-700">
              Active
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              Inactive
            </Badge>
          ),
        meta: { title: 'Status' },
      },
      {
        id: 'actions',
        enableHiding: false,
        enableSorting: false,
        meta: { className: 'w-10' },
        cell: ({ row }) => {
          const s = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="data-[state=open]:bg-muted">
                  <MoreHorizontal />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onSelect={() => openSheet(s)}>
                  <Pencil />
                  Edit & products
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {s.active ? (
                  <DropdownMenuItem variant="destructive" onSelect={() => setToRemove(s)}>
                    <Trash2 />
                    Remove
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onSelect={() => void reactivate(s)}>
                    <Power />
                    Reactivate
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [openSheet, reactivate],
  );

  const active = suppliers.filter((s) => s.active);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active suppliers" value={String(active.length)} hint={`${suppliers.length - active.length} inactive`} icon={Truck} tint="bg-sky-500/10 text-sky-600" loading={loading} failed={!!error} />
        <StatCard label="Product links" value={String(active.reduce((s, x) => s + (x.productCount ?? 0), 0))} hint="Product–supplier pairs" icon={Package} tint="bg-emerald-500/10 text-emerald-600" loading={loading} failed={!!error} />
        <StatCard label="Purchases logged" value={String(suppliers.reduce((s, x) => s + (x.procurementCount ?? 0), 0))} hint="All time" icon={ReceiptText} tint="bg-violet-500/10 text-violet-600" loading={loading} failed={!!error} />
        <StatCard
          label="Without products"
          value={String(active.filter((s) => !s.productCount).length)}
          hint="Active suppliers with nothing linked"
          icon={AlertCircle}
          tint="bg-amber-500/10 text-amber-600"
          loading={loading}
          failed={!!error}
        />
      </div>

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="size-4" />
            Couldn’t load suppliers: {error}
          </div>
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RotateCw />
            Retry
          </Button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={suppliers}
        isLoading={loading}
        getRowId={(s) => String(s.id)}
        initialSorting={[{ id: 'supplier', desc: false }]}
        searchPlaceholder="Search name, contact, phone, location…"
        filters={[
          {
            columnId: 'status',
            title: 'Status',
            options: [
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ],
          },
        ]}
        onRowClick={(s) => openSheet(s)}
        emptyMessage={suppliers.length === 0 ? 'No suppliers yet — add who you buy from.' : 'No suppliers match these filters.'}
        toolbarActions={
          <Button size="sm" className="h-8" onClick={() => openSheet(null)}>
            <Plus />
            Add supplier
          </Button>
        }
      />

      {sheet && (
        <SupplierSheet key={sheet.token} supplier={sheet.supplier} products={products} open={sheetOpen} onOpenChange={setSheetOpen} onSaved={() => void load()} />
      )}

      <AlertDialog open={!!toRemove} onOpenChange={(o) => !o && setToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {toRemove?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              If you’ve logged purchases or costs from them, they’re deactivated so that history stays intact — you can reactivate them
              later. If not, they’re deleted for good.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => void confirmRemove()}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
