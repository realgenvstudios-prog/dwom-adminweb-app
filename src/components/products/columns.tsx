import type { ColumnDef } from '@tanstack/react-table';
import { Archive, ImageOff, MoreHorizontal, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { DataTableColumnHeader, facetedFilterFn, selectColumn } from '@/components/data-table';
import { cn } from '@/lib/utils';
import { formatGhs } from '../orders/order-status';
import { STOCK_STATUSES, categoryIdOf, categoryNameOf, discountOf, priceOf, salePrice, stockMeta } from './product-meta';
import type { Product, ProductCategory } from './ProductTypes';
import DiscountCell from './DiscountCell';

export interface ProductActions {
  categories: ProductCategory[];
  onOpen: (p: Product) => void;
  onEdit: (p: Product) => void;
  onArchive: (p: Product) => void;
  onDiscount: (p: Product, discount: number) => Promise<void>;
  onStock: (p: Product, stockStatus: string) => void;
  onSeasonal: (p: Product, seasonal: boolean) => void;
}

export function buildProductColumns(a: ProductActions): ColumnDef<Product>[] {
  return [
    selectColumn<Product>(),
    {
      id: 'product',
      accessorFn: (p) => [p.nameEnglish, p.nameLocal, p.nameFrench].filter(Boolean).join(' '),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Product" />,
      sortingFn: (x, y) => x.original.nameEnglish.localeCompare(y.original.nameEnglish),
      enableHiding: false,
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="flex min-w-[200px] items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
              {p.imageUrl ? <img src={p.imageUrl} alt="" className="size-full object-cover" loading="lazy" /> : <ImageOff className="size-4 text-muted-foreground" />}
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium">{p.nameEnglish}</p>
              {p.nameLocal && <p className="truncate text-xs text-muted-foreground">{p.nameLocal}</p>}
            </div>
          </div>
        );
      },
      meta: { title: 'Product' },
    },
    {
      id: 'category',
      accessorFn: (p) => categoryIdOf(p),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Category" />,
      sortingFn: (x, y) => categoryNameOf(x.original, a.categories).localeCompare(categoryNameOf(y.original, a.categories)),
      filterFn: facetedFilterFn,
      enableGlobalFilter: false,
      cell: ({ row }) => <span className="text-muted-foreground">{categoryNameOf(row.original, a.categories) || 'None'}</span>,
      meta: { title: 'Category' },
    },
    {
      id: 'price',
      accessorFn: (p) => salePrice(p),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Price" className="justify-end" />,
      enableGlobalFilter: false,
      cell: ({ row }) => {
        const p = row.original;
        const off = discountOf(p) > 0;
        return (
          <div className="text-right whitespace-nowrap tabular-nums">
            {off && <div className="text-xs text-muted-foreground line-through">{formatGhs(priceOf(p))}</div>}
            <span className="font-medium">{formatGhs(salePrice(p))}</span>
            <span className="text-xs text-muted-foreground"> / {p.unitType}</span>
          </div>
        );
      },
      meta: { title: 'Price', className: 'text-right' },
    },
    {
      id: 'discount',
      accessorFn: (p) => (discountOf(p) > 0 ? 'discounted' : 'full'),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Discount" />,
      sortingFn: (x, y) => discountOf(x.original) - discountOf(y.original),
      filterFn: facetedFilterFn,
      enableGlobalFilter: false,
      cell: ({ row }) => <DiscountCell product={row.original} onCommit={(v) => a.onDiscount(row.original, v)} />,
      meta: { title: 'Discount' },
    },
    {
      id: 'stock',
      accessorFn: (p) => p.stockStatus || 'in_stock',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Stock" />,
      filterFn: facetedFilterFn,
      enableGlobalFilter: false,
      cell: ({ row }) => {
        const s = stockMeta(row.original.stockStatus);
        return (
          <Select value={s.value} onValueChange={(v) => a.onStock(row.original, v)}>
            <SelectTrigger size="sm" className={cn('h-7 w-[130px] gap-1.5 border font-medium shadow-none', s.badge)} aria-label="Stock status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STOCK_STATUSES.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  <o.icon className={o.tone} />
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      },
      meta: { title: 'Stock' },
    },
    {
      id: 'seasonal',
      accessorFn: (p) => (p.seasonal ? 'seasonal' : 'regular'),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Seasonal" />,
      filterFn: facetedFilterFn,
      enableGlobalFilter: false,
      cell: ({ row }) => (
        <Switch
          checked={!!row.original.seasonal}
          onCheckedChange={(v) => a.onSeasonal(row.original, v)}
          aria-label={`Seasonal: ${row.original.nameEnglish}`}
        />
      ),
      meta: { title: 'Seasonal' },
    },
    {
      id: 'actions',
      enableHiding: false,
      enableSorting: false,
      meta: { className: 'w-10' },
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="data-[state=open]:bg-muted">
              <MoreHorizontal />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onSelect={() => a.onOpen(row.original)}>View</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => a.onEdit(row.original)}>
              <Pencil />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => a.onArchive(row.original)}>
              <Archive />
              Archive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
