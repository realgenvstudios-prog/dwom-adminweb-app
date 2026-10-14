import type { ColumnDef } from '@tanstack/react-table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DataTableColumnHeader, facetedFilterFn } from '@/components/data-table';
import { cn } from '@/lib/utils';
import { formatGhs } from '../orders/order-status';
import { customerStatusMeta, formatDate, initialsOf, timeAgo, type Customer } from './CustomerTypes';

const time = (iso: string | null) => (iso ? new Date(iso).getTime() : 0);

export const customerColumns: ColumnDef<Customer>[] = [
  {
    id: 'customer',
    accessorFn: (c) => `${c.name} ${c.phone} ${c.email ?? ''} #${c.id}`,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Customer" />,
    sortingFn: (a, b) => a.original.name.localeCompare(b.original.name),
    enableHiding: false,
    cell: ({ row }) => {
      const c = row.original;
      return (
        <div className="flex min-w-[180px] items-center gap-3">
          <Avatar className="size-9">
            <AvatarFallback className="text-xs">{initialsOf(c.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-medium">{c.name}</p>
            <p className="text-xs text-muted-foreground tabular-nums">#{c.id}</p>
          </div>
        </div>
      );
    },
    meta: { title: 'Customer' },
  },
  {
    id: 'contact',
    accessorFn: (c) => c.phone,
    header: 'Contact',
    enableSorting: false,
    enableGlobalFilter: false,
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="tabular-nums">{row.original.phone || 'None'}</p>
        <p className="max-w-[200px] truncate text-xs text-muted-foreground">{row.original.email || 'No email'}</p>
      </div>
    ),
    meta: { title: 'Contact' },
  },
  {
    id: 'orders',
    accessorKey: 'totalOrders',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Orders" className="justify-end" />,
    enableGlobalFilter: false,
    cell: ({ row }) => <div className="text-right tabular-nums">{row.original.totalOrders}</div>,
    meta: { title: 'Orders', className: 'text-right' },
  },
  {
    id: 'spend',
    accessorKey: 'totalSpend',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Paid spend" className="justify-end" />,
    enableGlobalFilter: false,
    cell: ({ row }) => <div className="text-right font-medium whitespace-nowrap tabular-nums">{formatGhs(row.original.totalSpend)}</div>,
    meta: { title: 'Paid spend', className: 'text-right' },
  },
  {
    id: 'lastOrder',
    accessorFn: (c) => time(c.lastOrder),
    header: ({ column }) => <DataTableColumnHeader column={column} title="Last order" />,
    enableGlobalFilter: false,
    cell: ({ row }) =>
      row.original.lastOrder ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="whitespace-nowrap text-muted-foreground">{timeAgo(row.original.lastOrder)}</span>
          </TooltipTrigger>
          <TooltipContent>{formatDate(row.original.lastOrder)}</TooltipContent>
        </Tooltip>
      ) : (
        <span className="text-muted-foreground">None</span>
      ),
    meta: { title: 'Last order' },
  },
  {
    id: 'joined',
    accessorFn: (c) => time(c.createdAt),
    header: ({ column }) => <DataTableColumnHeader column={column} title="Joined" />,
    enableGlobalFilter: false,
    cell: ({ row }) => <span className="whitespace-nowrap text-muted-foreground">{formatDate(row.original.createdAt)}</span>,
    meta: { title: 'Joined' },
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    filterFn: facetedFilterFn,
    enableGlobalFilter: false,
    cell: ({ row }) => {
      const s = customerStatusMeta(row.original.status);
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className={cn('font-medium', s.badge)}>
              {s.label}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>{s.hint}</TooltipContent>
        </Tooltip>
      );
    },
    meta: { title: 'Status' },
  },
];
