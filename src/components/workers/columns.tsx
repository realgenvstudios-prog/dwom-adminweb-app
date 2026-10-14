import { Link } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Power, PowerOff, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DataTableColumnHeader, facetedFilterFn } from '@/components/data-table';
import type { Trip } from '../../services/workersService';
import { initialsOf, timeAgo } from '../customers/CustomerTypes';
import { formatGhs } from '../orders/order-status';
import { pickerTypeLabel, tripPay, type PickerRow } from './picker-meta';

export function buildRosterColumns(onToggleActive: (w: PickerRow) => void): ColumnDef<PickerRow>[] {
  return [
    {
      id: 'picker',
      accessorFn: (w) => `${w.name} ${w.phone ?? ''}`,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Picker" />,
      sortingFn: (a, b) => a.original.name.localeCompare(b.original.name),
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex min-w-[160px] items-center gap-3">
          <Avatar className="size-9">
            <AvatarFallback className="text-xs">{initialsOf(row.original.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-medium">{row.original.name}</p>
            <p className="text-xs text-muted-foreground tabular-nums">{row.original.phone || 'No phone'}</p>
          </div>
        </div>
      ),
      meta: { title: 'Picker' },
    },
    {
      id: 'type',
      accessorKey: 'type',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
      filterFn: facetedFilterFn,
      enableGlobalFilter: false,
      cell: ({ row }) => pickerTypeLabel(row.original.type),
      meta: { title: 'Type' },
    },
    {
      id: 'week',
      accessorKey: 'ordersThisWeek',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Orders (7 days)" className="justify-end" />,
      enableGlobalFilter: false,
      cell: ({ row }) => <div className="text-right tabular-nums">{row.original.ordersThisWeek}</div>,
      meta: { title: 'Orders (7 days)', className: 'text-right' },
    },
    {
      id: 'pay',
      accessorKey: 'payThisWeek',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Pay (7 days)" className="justify-end" />,
      enableGlobalFilter: false,
      cell: ({ row }) => <div className="text-right font-medium whitespace-nowrap tabular-nums">{formatGhs(row.original.payThisWeek)}</div>,
      meta: { title: 'Pay (7 days)', className: 'text-right' },
    },
    {
      id: 'lastTrip',
      accessorFn: (w) => (w.lastTrip ? new Date(w.lastTrip).getTime() : 0),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Last trip" />,
      enableGlobalFilter: false,
      cell: ({ row }) => <span className="whitespace-nowrap text-muted-foreground">{timeAgo(row.original.lastTrip)}</span>,
      meta: { title: 'Last trip' },
    },
    {
      id: 'status',
      accessorFn: (w) => (w.active ? 'active' : 'inactive'),
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
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="data-[state=open]:bg-muted">
              <MoreHorizontal />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {row.original.active ? (
              <DropdownMenuItem variant="destructive" onSelect={() => onToggleActive(row.original)}>
                <PowerOff />
                Deactivate
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onSelect={() => onToggleActive(row.original)}>
                <Power />
                Reactivate
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}

export function buildTripColumns(onRemove: (t: Trip) => void, canOpenOrders: boolean): ColumnDef<Trip>[] {
  return [
    {
      id: 'date',
      accessorFn: (t) => new Date(t.date).getTime(),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
      enableGlobalFilter: false,
      cell: ({ row }) => (
        <span className="whitespace-nowrap">
          {new Date(row.original.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })}
        </span>
      ),
      meta: { title: 'Date' },
    },
    {
      id: 'picker',
      accessorFn: (t) => String(t.workerId),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Picker" />,
      sortingFn: (a, b) => (a.original.Worker?.name ?? '').localeCompare(b.original.Worker?.name ?? ''),
      filterFn: facetedFilterFn,
      enableGlobalFilter: false,
      cell: ({ row }) => <span className="font-medium">{row.original.Worker?.name ?? `Picker #${row.original.workerId}`}</span>,
      meta: { title: 'Picker' },
    },
    {
      id: 'orders',
      accessorFn: (t) => t.TripOrder.map((o) => `#${o.orderId}`).join(' '),
      header: 'Orders',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.TripOrder.map((o) =>
            canOpenOrders ? (
              <Link key={o.id} to={`/orders?order=${o.orderId}`}>
                <Badge variant="secondary" className="font-normal tabular-nums hover:bg-secondary/70">
                  #{o.orderId}
                </Badge>
              </Link>
            ) : (
              <Badge key={o.id} variant="secondary" className="font-normal tabular-nums">
                #{o.orderId}
              </Badge>
            ),
          )}
        </div>
      ),
      meta: { title: 'Orders' },
    },
    {
      id: 'pay',
      accessorFn: (t) => tripPay(t),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Pay" className="justify-end" />,
      enableGlobalFilter: false,
      cell: ({ row }) => <div className="text-right font-medium whitespace-nowrap tabular-nums">{formatGhs(tripPay(row.original))}</div>,
      meta: { title: 'Pay', className: 'text-right' },
    },
    {
      id: 'notes',
      accessorFn: (t) => t.notes ?? '',
      header: 'Notes',
      enableSorting: false,
      cell: ({ row }) => <span className="block max-w-[220px] truncate text-muted-foreground">{row.original.notes || '—'}</span>,
      meta: { title: 'Notes' },
    },
    {
      id: 'actions',
      enableHiding: false,
      enableSorting: false,
      meta: { className: 'w-10' },
      cell: ({ row }) => (
        <Button variant="ghost" size="icon-sm" onClick={() => onRemove(row.original)} aria-label="Remove trip">
          <Trash2 />
        </Button>
      ),
    },
  ];
}
