import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, DataTableColumnHeader, selectColumn } from '@/components/data-table';
import couponService, { type DiscountCustomer } from '../../services/couponService';
import { logger } from '../../utils/logger';
import { formatDate } from '../customers/CustomerTypes';
import { formatGhs } from '../orders/order-status';
import SendNotificationDialog from './SendNotificationDialog';

/** Who uses discount codes, across every code. Pick rows to message them. */
export default function DiscountCustomersTable({ refreshKey }: { refreshKey: number }) {
  const [rows, setRows] = useState<DiscountCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [message, setMessage] = useState<{ userIds: number[]; token: number } | null>(null);
  const [messageOpen, setMessageOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    couponService
      .getDiscountCustomers()
      .then((r) => {
        if (cancelled) return;
        setRows(r);
        setFailed(false);
      })
      .catch((err) => {
        logger.error('Failed to load discount customers:', err);
        if (!cancelled) setFailed(true);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const openMessage = (userIds: number[]) => {
    setMessage((prev) => ({ userIds, token: (prev?.token ?? 0) + 1 }));
    setMessageOpen(true);
  };

  const columns = useMemo<ColumnDef<DiscountCustomer>[]>(
    () => [
      selectColumn<DiscountCustomer>(),
      {
        id: 'customer',
        accessorFn: (c) => `${c.name ?? ''} ${c.phone ?? ''} ${c.codes.join(' ')}`,
        header: 'Customer',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="min-w-[150px]">
            <Link to={`/customers?customer=${row.original.userId}`} className="font-medium hover:underline" onClick={(e) => e.stopPropagation()}>
              {row.original.name || 'Unnamed customer'}
            </Link>
            <p className="text-xs text-muted-foreground tabular-nums">{row.original.phone}</p>
          </div>
        ),
        meta: { title: 'Customer' },
      },
      {
        id: 'codes',
        header: 'Codes used',
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => (
          <div className="flex max-w-[220px] flex-wrap gap-1">
            {row.original.codes.map((code) => (
              <Badge key={code} variant="outline" className="font-mono text-[11px]">
                {code}
              </Badge>
            ))}
          </div>
        ),
        meta: { title: 'Codes used' },
      },
      {
        id: 'uses',
        accessorKey: 'uses',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Uses" className="justify-end" />,
        enableGlobalFilter: false,
        cell: ({ row }) => <div className="text-right tabular-nums">{row.original.uses}</div>,
        meta: { title: 'Uses', className: 'text-right' },
      },
      {
        id: 'discount',
        accessorKey: 'totalDiscount',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Discount" className="justify-end" />,
        enableGlobalFilter: false,
        cell: ({ row }) => <div className="text-right tabular-nums">{formatGhs(row.original.totalDiscount)}</div>,
        meta: { title: 'Discount', className: 'text-right' },
      },
      {
        id: 'paid',
        accessorKey: 'paidOrderValue',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Paid orders" className="justify-end" />,
        enableGlobalFilter: false,
        cell: ({ row }) => <div className="text-right tabular-nums">{formatGhs(row.original.paidOrderValue)}</div>,
        meta: { title: 'Paid orders', className: 'text-right' },
      },
      {
        id: 'last',
        accessorFn: (c) => new Date(c.lastUsedAt).getTime(),
        header: ({ column }) => <DataTableColumnHeader column={column} title="Last used" />,
        enableGlobalFilter: false,
        cell: ({ row }) => <span className="whitespace-nowrap text-muted-foreground">{formatDate(row.original.lastUsedAt)}</span>,
        meta: { title: 'Last used' },
      },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="space-y-1">
        <h2 className="text-base font-semibold">Customers using discounts</h2>
        <p className="text-sm text-muted-foreground">Everyone who has used a code, most discount first. “Paid orders” is what they spent on orders that used a code.</p>
      </div>
      <DataTable
        columns={columns}
        data={rows}
        isLoading={loading}
        getRowId={(c) => String(c.userId)}
        initialSorting={[{ id: 'discount', desc: true }]}
        searchPlaceholder="Search name, phone or code…"
        toolbarActions={(table) => {
          const visible = table.getFilteredRowModel().rows.map((r) => r.original.userId);
          return (
            <Button size="sm" variant="outline" className="h-8" disabled={!visible.length} onClick={() => openMessage(visible)}>
              <Send />
              Message all {visible.length || ''}
            </Button>
          );
        }}
        bulkActions={(selected, clear) => (
          <Button
            size="sm"
            className="h-8"
            onClick={() => {
              openMessage(selected.map((c) => c.userId));
              clear();
            }}
          >
            <Send />
            Message {selected.length}
          </Button>
        )}
        emptyMessage={failed ? 'Couldn’t load customers. Refresh to try again.' : 'Nobody has used a discount code yet.'}
      />
      {message && <SendNotificationDialog key={message.token} initialUserIds={message.userIds} open={messageOpen} onOpenChange={setMessageOpen} />}
    </div>
  );
}
