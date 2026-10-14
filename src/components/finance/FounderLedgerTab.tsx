import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { AlertCircle, ArrowDownLeft, ArrowUpRight, MoreHorizontal, Pencil, Plus, Receipt, RotateCw, Scale, Trash2 } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTable, DataTableColumnHeader, facetedFilterFn } from '@/components/data-table';
import { StatCard } from '@/components/stat-card';
import { cn } from '@/lib/utils';
import founderLedgerService, { type FounderBalance, type FounderLedgerEntry } from '../../services/founderLedgerService';
import { logger } from '../../utils/logger';
import { initialsOf } from '../customers/CustomerTypes';
import { formatGhs } from '../orders/order-status';
import FounderEntryDialog from './FounderEntryDialog';
import { FOUNDER_METHODS, amountOf, methodLabel } from './expense-meta';

const FounderLedgerTab: React.FC = () => {
  const [entries, setEntries] = useState<FounderLedgerEntry[]>([]);
  const [balance, setBalance] = useState<FounderBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ entry: FounderLedgerEntry | null; token: number } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toDelete, setToDelete] = useState<FounderLedgerEntry | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [e, b] = await Promise.all([founderLedgerService.getAll(), founderLedgerService.getBalance()]);
      setEntries(e ?? []);
      setBalance(b);
    } catch (err) {
      logger.error('Failed to load founder ledger:', err);
      setError(err instanceof Error ? err.message : 'Failed to load the founder ledger');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  const openDialog = useCallback((entry: FounderLedgerEntry | null) => {
    setDialog({ entry, token: Date.now() });
    setDialogOpen(true);
  }, []);

  const confirmDelete = async () => {
    const e = toDelete;
    if (!e) return;
    try {
      await founderLedgerService.remove(e.id);
      toast.success('Entry deleted');
      await load();
    } catch (err) {
      logger.error('Failed to delete entry:', err);
      toast.error('Couldn’t delete the entry.');
    } finally {
      setToDelete(null);
    }
  };

  const founders = useMemo(() => [...new Set(entries.map((e) => e.founderName))].sort(), [entries]);

  const columns = useMemo<ColumnDef<FounderLedgerEntry>[]>(
    () => [
      {
        id: 'date',
        accessorFn: (e) => new Date(e.date).getTime(),
        header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
        enableGlobalFilter: false,
        cell: ({ row }) => <span className="whitespace-nowrap">{new Date(row.original.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })}</span>,
        meta: { title: 'Date' },
      },
      {
        id: 'founder',
        accessorKey: 'founderName',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Founder" />,
        filterFn: facetedFilterFn,
        cell: ({ row }) => <span className="font-medium">{row.original.founderName}</span>,
        meta: { title: 'Founder' },
      },
      {
        id: 'type',
        accessorKey: 'type',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Direction" />,
        filterFn: facetedFilterFn,
        enableGlobalFilter: false,
        cell: ({ row }) =>
          row.original.type === 'contribution' ? (
            <span className="flex items-center gap-1.5 text-emerald-700">
              <ArrowDownLeft className="size-4" />
              In
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-amber-700">
              <ArrowUpRight className="size-4" />
              Out
            </span>
          ),
        meta: { title: 'Direction' },
      },
      {
        id: 'amount',
        accessorFn: (e) => amountOf(e),
        header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" className="justify-end" />,
        enableGlobalFilter: false,
        cell: ({ row }) => (
          <div className={cn('text-right font-medium whitespace-nowrap tabular-nums', row.original.type === 'contribution' ? 'text-emerald-700' : 'text-amber-700')}>
            {row.original.type === 'contribution' ? '+' : '−'}
            {formatGhs(amountOf(row.original))}
          </div>
        ),
        meta: { title: 'Amount', className: 'text-right' },
      },
      {
        id: 'method',
        accessorFn: (e) => e.method ?? 'none',
        header: 'Method',
        filterFn: facetedFilterFn,
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => <span className="text-muted-foreground">{methodLabel(row.original.method)}</span>,
        meta: { title: 'Method' },
      },
      {
        id: 'notes',
        accessorFn: (e) => `${e.notes ?? ''} ${e.approvedBy ?? ''}`,
        header: 'Notes',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex max-w-[280px] items-center gap-2">
            <span className="truncate text-muted-foreground">
              {[row.original.notes, row.original.approvedBy && `approved by ${row.original.approvedBy}`].filter(Boolean).join(' · ') || 'None'}
            </span>
            {row.original.receiptUrl && (
              <a href={row.original.receiptUrl} target="_blank" rel="noreferrer" className="shrink-0 text-muted-foreground hover:text-foreground" aria-label="Open receipt">
                <Receipt className="size-3.5" />
              </a>
            )}
          </div>
        ),
        meta: { title: 'Notes' },
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
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onSelect={() => openDialog(row.original)}>
                <Pencil />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => setToDelete(row.original)}>
                <Trash2 />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [openDialog],
  );

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        Money founders put into DWOM and what’s been paid back. Kept fully separate from business revenue, expenses, and the P&L.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Put in by founders" value={formatGhs(balance?.totalContributions)} hint="All contributions" icon={ArrowDownLeft} tint="bg-emerald-500/10 text-emerald-600" loading={loading} failed={!!error} />
        <StatCard label="Paid back" value={formatGhs(balance?.totalReimbursements)} hint="All reimbursements" icon={ArrowUpRight} tint="bg-amber-500/10 text-amber-600" loading={loading} failed={!!error} />
        <StatCard
          label="DWOM still owes"
          value={formatGhs(balance?.balance)}
          hint={balance && balance.balance < 0 ? 'Founders have been overpaid' : 'Outstanding to founders'}
          icon={Scale}
          tint="bg-sky-500/10 text-sky-600"
          loading={loading}
          failed={!!error}
        />
      </div>

      {balance && balance.byFounder.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {balance.byFounder.map((f) => {
            const repaid = f.contributions > 0 ? Math.min(100, (f.reimbursements / f.contributions) * 100) : 0;
            return (
              <Card key={f.founderName} className="gap-0 py-0">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-9">
                      <AvatarFallback className="text-xs">{initialsOf(f.founderName)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{f.founderName}</p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {formatGhs(f.contributions)} in · {formatGhs(f.reimbursements)} back
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={cn('font-semibold tabular-nums', f.balance < 0 && 'text-red-600')}>{formatGhs(f.balance)}</p>
                      <p className="text-xs text-muted-foreground">owed</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-chart-1" style={{ width: `${repaid}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground">{repaid.toFixed(0)}% repaid</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="size-4" />
            Couldn’t load the ledger: {error}
          </div>
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RotateCw />
            Retry
          </Button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={entries}
        isLoading={loading}
        getRowId={(e) => String(e.id)}
        initialSorting={[{ id: 'date', desc: true }]}
        searchPlaceholder="Search notes, founder…"
        filters={[
          { columnId: 'founder', title: 'Founder', options: founders.map((f) => ({ value: f, label: f })) },
          {
            columnId: 'type',
            title: 'Direction',
            options: [
              { value: 'contribution', label: 'Money in' },
              { value: 'reimbursement', label: 'Money out' },
            ],
          },
          { columnId: 'method', title: 'Method', options: [...FOUNDER_METHODS, { value: 'none', label: 'Not specified' }] },
        ]}
        toolbarActions={
          <Button size="sm" className="h-8" onClick={() => openDialog(null)}>
            <Plus />
            Record entry
          </Button>
        }
        emptyMessage={entries.length === 0 ? 'No founder money recorded yet.' : 'No entries match these filters.'}
      />

      {dialog && <FounderEntryDialog key={dialog.token} entry={dialog.entry} founders={founders} open={dialogOpen} onOpenChange={setDialogOpen} onSaved={() => void load()} />}

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete && `${toDelete.founderName} · ${toDelete.type === 'contribution' ? 'in' : 'out'} ${formatGhs(amountOf(toDelete))}. `}
              Balances update immediately; this can’t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => void confirmDelete()}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FounderLedgerTab;
