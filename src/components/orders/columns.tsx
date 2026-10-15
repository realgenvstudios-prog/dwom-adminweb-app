import type { ColumnDef } from '@tanstack/react-table';
import { Bike, Copy, Eye, MoreHorizontal, ShoppingBasket } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DataTableColumnHeader, facetedFilterFn, selectColumn } from '@/components/data-table';
import { cn } from '@/lib/utils';
import type { Order } from './OrderTypes';
import { formatDateTime, formatGhs, orderStatusMeta, paymentMethodMeta, paymentStatusMeta } from './order-status';
import { can } from '../../config/permissions';

export interface OrderRowActions {
  onView: (order: Order) => void;
  onAssignRider: (order: Order) => void;
  onAssignPicker: (order: Order) => void;
}

export const UNASSIGNED = 'unassigned';
export const NO_ZONE = '__none__';

export function buildOrderColumns({ onView, onAssignRider, onAssignPicker }: OrderRowActions): ColumnDef<Order>[] {
  return [
    selectColumn<Order>(),
    {
      id: 'order',
      accessorKey: 'id',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Order" />,
      sortingFn: (a, b) => Number(a.original.id) - Number(b.original.id),
      cell: ({ row }) => <span className="font-medium tabular-nums">#{row.original.id}</span>,
      enableHiding: false,
      meta: { title: 'Order' },
    },
    {
      id: 'placed',
      accessorKey: 'createdAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Placed" />,
      cell: ({ row }) => <span className="whitespace-nowrap text-muted-foreground">{formatDateTime(row.original.createdAt)}</span>,
      enableGlobalFilter: false,
      meta: { title: 'Placed' },
    },
    {
      id: 'customer',
      accessorFn: (o) => `${o.customer} ${o.phone}`,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Customer" />,
      sortingFn: (a, b) => a.original.customer.localeCompare(b.original.customer),
      cell: ({ row }) => (
        <div className="min-w-0">
          <div className="truncate font-medium">{row.original.customer}</div>
          {row.original.phone && <div className="text-xs text-muted-foreground tabular-nums">{row.original.phone}</div>}
        </div>
      ),
      meta: { title: 'Customer' },
    },
    {
      id: 'address',
      accessorKey: 'address',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Delivery address" />,
      enableSorting: false,
      cell: ({ row }) =>
        row.original.address ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="block max-w-[220px] truncate text-muted-foreground">{row.original.address}</span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">{row.original.address}</TooltipContent>
          </Tooltip>
        ) : (
          <span className="text-muted-foreground">None</span>
        ),
      meta: { title: 'Delivery address' },
    },
    {
      id: 'zone',
      accessorFn: (o) => o.zone ?? NO_ZONE,
      header: 'Zone',
      filterFn: facetedFilterFn,
      enableSorting: false,
      enableGlobalFilter: false,
      cell: ({ row }) => (row.original.zone ? <span className="whitespace-nowrap">{row.original.zone}</span> : <span className="text-muted-foreground">Not recorded</span>),
      meta: { title: 'Zone' },
    },
    {
      id: 'rider',
      accessorFn: (o) => o.rider?.id ?? UNASSIGNED,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Rider" />,
      sortingFn: (a, b) => (a.original.rider?.name ?? '').localeCompare(b.original.rider?.name ?? ''),
      filterFn: facetedFilterFn,
      enableGlobalFilter: false,
      cell: ({ row }) => {
        const { rider, picker } = row.original;
        return (
          <div className="min-w-0">
            {rider ? <div className="truncate">{rider.name}</div> : <span className="text-muted-foreground italic">Unassigned</span>}
            {picker && <div className="truncate text-xs text-muted-foreground">Picker: {picker.name}</div>}
          </div>
        );
      },
      meta: { title: 'Rider' },
    },
    {
      id: 'items',
      accessorKey: 'itemsCount',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Items" className="justify-end" />,
      cell: ({ row }) => <div className="text-right tabular-nums">{row.original.itemsCount}</div>,
      enableGlobalFilter: false,
      meta: { title: 'Items', className: 'text-right' },
    },
    {
      id: 'total',
      accessorKey: 'total',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Total" className="justify-end" />,
      cell: ({ row }) => <div className="text-right font-medium whitespace-nowrap tabular-nums">{formatGhs(row.original.total)}</div>,
      enableGlobalFilter: false,
      meta: { title: 'Total', className: 'text-right' },
    },
    {
      id: 'payment',
      accessorKey: 'paymentStatus',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Payment" />,
      filterFn: facetedFilterFn,
      enableGlobalFilter: false,
      cell: ({ row }) => {
        const status = paymentStatusMeta(row.original.paymentStatus);
        const method = paymentMethodMeta(row.original.paymentMethod);
        return (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn('font-medium', status.badge)}>
              {status.label}
            </Badge>
            <Tooltip>
              <TooltipTrigger asChild>
                <method.icon className="size-4 text-muted-foreground" aria-label={method.label} />
              </TooltipTrigger>
              <TooltipContent>{method.label}</TooltipContent>
            </Tooltip>
          </div>
        );
      },
      meta: { title: 'Payment' },
    },
    {
      id: 'method',
      accessorKey: 'paymentMethod',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Method" />,
      filterFn: facetedFilterFn,
      enableGlobalFilter: false,
      cell: ({ row }) => paymentMethodMeta(row.original.paymentMethod).label,
      meta: { title: 'Method' },
    },
    {
      id: 'status',
      accessorKey: 'orderStatus',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      filterFn: facetedFilterFn,
      enableGlobalFilter: false,
      cell: ({ row }) => {
        const s = orderStatusMeta(row.original.orderStatus);
        return (
          <div className="flex items-center gap-2 whitespace-nowrap">
            <s.icon className={cn('size-4', s.tone)} />
            <span>{s.label}</span>
          </div>
        );
      },
      meta: { title: 'Status' },
    },
    {
      id: 'actions',
      enableHiding: false,
      enableSorting: false,
      meta: { className: 'w-10' },
      cell: ({ row }) => {
        const order = row.original;
        const closed = order.orderStatus === 'cancelled' || order.orderStatus === 'delivered';
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="data-[state=open]:bg-muted">
                <MoreHorizontal />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onSelect={() => onView(order)}>
                <Eye />
                View details
              </DropdownMenuItem>
              {!closed && (
                <>
                  {can('orders.assignRider') && (
                    <DropdownMenuItem onSelect={() => onAssignRider(order)}>
                      <Bike />
                      {order.rider ? 'Reassign rider' : 'Assign rider'}
                    </DropdownMenuItem>
                  )}
                  {can('orders.assignPicker') && (
                    <DropdownMenuItem onSelect={() => onAssignPicker(order)}>
                      <ShoppingBasket />
                      {order.picker ? 'Reassign picker' : 'Assign picker'}
                    </DropdownMenuItem>
                  )}
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => {
                  navigator.clipboard?.writeText(order.id);
                  toast.success(`Copied order #${order.id}`);
                }}
              >
                <Copy />
                Copy order ID
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
