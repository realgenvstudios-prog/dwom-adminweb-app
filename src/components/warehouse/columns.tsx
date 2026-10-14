import type { ColumnDef } from '@tanstack/react-table';
import { ArrowLeftRight, History, ImageOff, MoreHorizontal, PackagePlus, SlidersHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTableColumnHeader, facetedFilterFn, selectColumn } from '@/components/data-table';
import { cn } from '@/lib/utils';
import { timeAgo } from '../customers/CustomerTypes';
import type { StockAction } from './StockDialogs';
import { LEVELS, levelOf, type InventoryRow } from './inventory-meta';

export function buildInventoryColumns(onAction: (row: InventoryRow, action: StockAction | 'history') => void): ColumnDef<InventoryRow>[] {
  return [
    selectColumn<InventoryRow>(),
    {
      id: 'product',
      accessorFn: (r) => r.Product?.nameEnglish ?? '',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Product" />,
      enableHiding: false,
      cell: ({ row }) => {
        const p = row.original.Product;
        const archived = p?.active === false;
        return (
          <div className={cn('flex min-w-[180px] items-center gap-3', archived && 'opacity-60')}>
            <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
              {p?.imageUrl ? <img src={p.imageUrl} alt="" className="size-full object-cover" loading="lazy" /> : <ImageOff className="size-3.5 text-muted-foreground" />}
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium">{p?.nameEnglish ?? `Product #${row.original.productId}`}</p>
              <p className="truncate text-xs text-muted-foreground">
                {archived ? 'Archived product' : (p?.Category?.name ?? 'None')}
              </p>
            </div>
          </div>
        );
      },
      meta: { title: 'Product' },
    },
    {
      id: 'onHand',
      accessorKey: 'quantity',
      header: ({ column }) => <DataTableColumnHeader column={column} title="On hand" className="justify-end" />,
      enableGlobalFilter: false,
      cell: ({ row }) => (
        <div className="text-right tabular-nums">
          <span className="font-semibold">{row.original.quantity.toLocaleString()}</span>
          <span className="ml-1 text-xs text-muted-foreground">{row.original.Product?.unitType ?? ''}</span>
        </div>
      ),
      meta: { title: 'On hand', className: 'text-right' },
    },
    {
      id: 'reorderAt',
      accessorKey: 'reorderLevel',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Reorder at" className="justify-end" />,
      enableGlobalFilter: false,
      cell: ({ row }) => <div className="text-right text-muted-foreground tabular-nums">≤ {row.original.reorderLevel}</div>,
      meta: { title: 'Reorder at', className: 'text-right' },
    },
    {
      id: 'level',
      accessorFn: (r) => levelOf(r),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Level" />,
      filterFn: facetedFilterFn,
      enableGlobalFilter: false,
      cell: ({ row }) => {
        const l = LEVELS[levelOf(row.original)];
        return (
          <Badge variant="outline" className={cn('gap-1 font-medium', l.badge)}>
            <l.icon className="size-3" />
            {l.label}
          </Badge>
        );
      },
      meta: { title: 'Level' },
    },
    {
      id: 'restocked',
      accessorFn: (r) => (r.lastRestockedAt ? new Date(r.lastRestockedAt).getTime() : 0),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Last restocked" />,
      enableGlobalFilter: false,
      cell: ({ row }) => <span className="whitespace-nowrap text-muted-foreground">{row.original.lastRestockedAt ? timeAgo(row.original.lastRestockedAt) : 'Never'}</span>,
      meta: { title: 'Last restocked' },
    },
    {
      id: 'status',
      accessorFn: (r) => (r.Product?.active === false ? 'archived' : 'live'),
      header: 'Product status',
      filterFn: facetedFilterFn,
      enableGlobalFilter: false,
      enableSorting: false,
      cell: ({ row }) => (row.original.Product?.active === false ? 'Archived' : 'Live'),
      meta: { title: 'Product status' },
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
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onSelect={() => onAction(row.original, 'receive')}>
              <PackagePlus />
              Receive stock
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onAction(row.original, 'move')}>
              <ArrowLeftRight />
              Record a change
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onAction(row.original, 'levels')}>
              <SlidersHorizontal />
              Reorder levels
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onAction(row.original, 'history')}>
              <History />
              History
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
