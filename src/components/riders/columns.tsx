import type { ColumnDef } from '@tanstack/react-table';
import { MapPin, MoreHorizontal, Power, PowerOff, Star } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTableColumnHeader, facetedFilterFn } from '@/components/data-table';
import { cn } from '@/lib/utils';
import { formatGhs } from '../orders/order-status';
import { initialsOf } from '../customers/CustomerTypes';
import { NO_ZONE, RIDER_STATUSES, num, riderStatusMeta, vehicleMeta } from './rider-meta';
import type { Rider } from './useRidersData';

export interface RiderActions {
  onView: (r: Rider) => void;
  onStatus: (r: Rider, status: string) => void;
  onAssignZone: (r: Rider) => void;
  onToggleActive: (r: Rider) => void;
}

export function buildRiderColumns(a: RiderActions): ColumnDef<Rider>[] {
  return [
    {
      id: 'rider',
      accessorFn: (r) => `${r.name} ${r.phone} ${r.email}`,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Rider" />,
      sortingFn: (x, y) => x.original.name.localeCompare(y.original.name),
      enableHiding: false,
      cell: ({ row }) => {
        const r = row.original;
        const v = vehicleMeta(r.vehicleType);
        return (
          <div className={cn('flex min-w-[180px] items-center gap-3', !r.isActive && 'opacity-60')}>
            <Avatar className="size-9">
              <AvatarFallback className="text-xs">{initialsOf(r.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-medium">{r.name}</p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <v.icon className="size-3" />
                {v.label}
                <span className="tabular-nums">· {r.phone || 'no phone'}</span>
              </p>
            </div>
          </div>
        );
      },
      meta: { title: 'Rider' },
    },
    {
      id: 'zone',
      accessorFn: (r) => (r.zoneId != null ? String(r.zoneId) : NO_ZONE),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Zone" />,
      sortingFn: (x, y) => (x.original.zoneId != null ? x.original.zone : '~').localeCompare(y.original.zoneId != null ? y.original.zone : '~'),
      filterFn: facetedFilterFn,
      enableGlobalFilter: false,
      cell: ({ row }) =>
        row.original.zoneId != null ? (
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <MapPin className="size-3.5 text-muted-foreground" />
            {row.original.zone}
          </span>
        ) : (
          <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-700">
            No zone
          </Badge>
        ),
      meta: { title: 'Zone' },
    },
    {
      id: 'status',
      accessorFn: (r) => (r.isActive ? r.status : 'deactivated'),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      filterFn: facetedFilterFn,
      enableGlobalFilter: false,
      cell: ({ row }) => {
        const r = row.original;
        if (!r.isActive) {
          return (
            <Badge variant="outline" className="text-muted-foreground">
              Deactivated
            </Badge>
          );
        }
        const s = riderStatusMeta(r.status);
        return (
          <Select value={s.value} onValueChange={(v) => a.onStatus(r, v)}>
            <SelectTrigger size="sm" className={cn('h-7 w-[132px] gap-1.5 border font-medium shadow-none', s.badge)} aria-label="Rider status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RIDER_STATUSES.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  <o.icon className={o.tone} />
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      },
      meta: { title: 'Status' },
    },
    {
      id: 'activeOrders',
      accessorKey: 'activeOrders',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Active orders" className="justify-end" />,
      enableGlobalFilter: false,
      cell: ({ row }) => <div className={cn('text-right tabular-nums', !row.original.activeOrders && 'text-muted-foreground')}>{row.original.activeOrders ?? 0}</div>,
      meta: { title: 'Active orders', className: 'text-right' },
    },
    {
      id: 'rating',
      accessorFn: (r) => num(r.rating),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Rating" />,
      enableGlobalFilter: false,
      cell: ({ row }) => (
        <span className="flex items-center gap-1 tabular-nums">
          <Star className="size-3.5 fill-amber-400 text-amber-400" />
          {num(row.original.rating).toFixed(1)}
        </span>
      ),
      meta: { title: 'Rating' },
    },
    {
      id: 'deliveries',
      accessorFn: (r) => num(r.totalDeliveries),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Deliveries" className="justify-end" />,
      enableGlobalFilter: false,
      cell: ({ row }) => <div className="text-right tabular-nums">{num(row.original.totalDeliveries).toLocaleString()}</div>,
      meta: { title: 'Deliveries', className: 'text-right' },
    },
    {
      id: 'earnings',
      accessorFn: (r) => num(r.totalEarnings),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Earnings" className="justify-end" />,
      enableGlobalFilter: false,
      cell: ({ row }) => <div className="text-right font-medium whitespace-nowrap tabular-nums">{formatGhs(num(row.original.totalEarnings))}</div>,
      meta: { title: 'Earnings', className: 'text-right' },
    },
    {
      id: 'actions',
      enableHiding: false,
      enableSorting: false,
      meta: { className: 'w-10' },
      cell: ({ row }) => {
        const r = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="data-[state=open]:bg-muted">
                <MoreHorizontal />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onSelect={() => a.onView(r)}>View details</DropdownMenuItem>
              {r.isActive && (
                <DropdownMenuItem onSelect={() => a.onAssignZone(r)}>
                  <MapPin />
                  {r.zoneId == null ? 'Assign zone' : 'Change zone'}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {r.isActive ? (
                <DropdownMenuItem variant="destructive" onSelect={() => a.onToggleActive(r)}>
                  <PowerOff />
                  Deactivate
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onSelect={() => a.onToggleActive(r)}>
                  <Power />
                  Reactivate
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
