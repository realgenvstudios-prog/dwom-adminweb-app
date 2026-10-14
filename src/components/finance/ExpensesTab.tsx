import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { AlertCircle, CalendarDays, Download, MoreHorizontal, Pencil, Plus, Receipt, Repeat, RotateCw, Tag, Trash2, Wallet } from 'lucide-react';
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
import { DataTable, DataTableColumnHeader, facetedFilterFn } from '@/components/data-table';
import { StatCard } from '@/components/stat-card';
import expensesService, { type Expense } from '../../services/expensesService';
import { logger } from '../../utils/logger';
import { formatGhs } from '../orders/order-status';
import ExpenseDialog from './ExpenseDialog';
import { EXPENSE_METHODS, amountOf, methodLabel, monthKey } from './expense-meta';

type Range = 'month' | 'lastMonth' | '90d' | 'all';
const RANGES: { value: Range; label: string }[] = [
  { value: 'month', label: 'This month' },
  { value: 'lastMonth', label: 'Last month' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
];

function inRange(e: Expense, range: Range, now: Date): boolean {
  if (range === 'all') return true;
  const key = monthKey(e.date);
  if (range === 'month') return key === monthKey(now);
  if (range === 'lastMonth') {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    return key === monthKey(d);
  }
  return new Date(e.date).getTime() >= now.getTime() - 90 * 86_400_000;
}

function csvCell(v: string | number) {
  let s = String(v);
  if (typeof v === 'string' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function exportCsv(rows: Expense[]) {
  const header = ['Date', 'Category', 'Amount (GHS)', 'Type', 'Recurring', 'Paid by', 'Payment method', 'Notes', 'Receipt'];
  const lines = rows.map((e) => [
    e.date.slice(0, 10),
    e.category,
    amountOf(e).toFixed(2),
    e.isCapex ? 'Capital' : 'Operating',
    e.recurring ? 'Yes' : 'No',
    e.paidBy ?? '',
    methodLabel(e.paymentMethod),
    e.notes ?? '',
    e.receiptUrl ?? '',
  ]);
  const csv = [header, ...lines].map((l) => l.map(csvCell).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `dwom-expenses-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const ExpensesTab: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<Range>('month');
  const [dialog, setDialog] = useState<{ expense: Expense | null; token: number } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Expense | null>(null);
  const [now] = useState(() => new Date());

  const load = useCallback(async () => {
    try {
      setError(null);
      setExpenses((await expensesService.getAll()) ?? []);
    } catch (err) {
      logger.error('Failed to load expenses:', err);
      setError(err instanceof Error ? err.message : 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  const openDialog = useCallback((expense: Expense | null) => {
    setDialog({ expense, token: Date.now() });
    setDialogOpen(true);
  }, []);

  const confirmDelete = async () => {
    const e = toDelete;
    if (!e) return;
    try {
      await expensesService.remove(e.id);
      setExpenses((prev) => prev.filter((x) => x.id !== e.id));
      toast.success('Expense deleted');
    } catch (err) {
      logger.error('Failed to delete expense:', err);
      toast.error('Couldn’t delete the expense.');
    } finally {
      setToDelete(null);
    }
  };

  const columns = useMemo<ColumnDef<Expense>[]>(
    () => [
      {
        id: 'date',
        accessorFn: (e) => new Date(e.date).getTime(),
        header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
        enableGlobalFilter: false,
        cell: ({ row }) => (
          <span className="whitespace-nowrap">{new Date(row.original.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })}</span>
        ),
        meta: { title: 'Date' },
      },
      {
        id: 'category',
        accessorKey: 'category',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Category" />,
        filterFn: facetedFilterFn,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="font-medium">{row.original.category}</span>
            {row.original.recurring && (
              <Repeat className="size-3.5 text-muted-foreground" aria-label="Recurring" />
            )}
          </div>
        ),
        meta: { title: 'Category' },
      },
      {
        id: 'amount',
        accessorFn: (e) => amountOf(e),
        header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" className="justify-end" />,
        enableGlobalFilter: false,
        cell: ({ row }) => <div className="text-right font-medium whitespace-nowrap tabular-nums">{formatGhs(amountOf(row.original))}</div>,
        meta: { title: 'Amount', className: 'text-right' },
      },
      {
        id: 'type',
        accessorFn: (e) => (e.isCapex ? 'capex' : 'opex'),
        header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
        filterFn: facetedFilterFn,
        enableGlobalFilter: false,
        cell: ({ row }) =>
          row.original.isCapex ? (
            <Badge variant="outline" className="border-violet-500/20 bg-violet-500/10 text-violet-700">
              Capital
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              Operating
            </Badge>
          ),
        meta: { title: 'Type' },
      },
      {
        id: 'paidBy',
        accessorFn: (e) => e.paidBy ?? '',
        header: 'Paid by',
        enableSorting: false,
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.paidBy || 'None'}</span>,
        meta: { title: 'Paid by' },
      },
      {
        id: 'method',
        accessorFn: (e) => e.paymentMethod ?? 'none',
        header: 'Method',
        filterFn: facetedFilterFn,
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => <span className="text-muted-foreground">{methodLabel(row.original.paymentMethod)}</span>,
        meta: { title: 'Method' },
      },
      {
        id: 'notes',
        accessorFn: (e) => e.notes ?? '',
        header: 'Notes',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex max-w-[260px] items-center gap-2">
            <span className="truncate text-muted-foreground">{row.original.notes || 'None'}</span>
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

  const visible = expenses.filter((e) => inRange(e, range, now));
  const opex = (r: Range) => expenses.filter((e) => !e.isCapex && inRange(e, r, now)).reduce((s, e) => s + amountOf(e), 0);
  const thisMonth = opex('month');
  const lastMonth = opex('lastMonth');
  const change = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : null;
  const byCategory = new Map<string, number>();
  expenses.filter((e) => !e.isCapex && inRange(e, 'month', now)).forEach((e) => byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + amountOf(e)));
  const top = [...byCategory.entries()].sort((a, b) => b[1] - a[1])[0];
  const recurring = expenses.filter((e) => !e.isCapex && e.recurring && inRange(e, 'month', now)).reduce((s, e) => s + amountOf(e), 0);
  const capexYear = expenses.filter((e) => e.isCapex && new Date(e.date).getUTCFullYear() === now.getUTCFullYear()).reduce((s, e) => s + amountOf(e), 0);
  const categories = [...new Set(expenses.map((e) => e.category))].sort();

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Operating costs this month"
          value={formatGhs(thisMonth)}
          hint={`${formatGhs(lastMonth)} last month`}
          change={change}
          icon={Wallet}
          tint="bg-red-500/10 text-red-600"
          loading={loading}
          failed={!!error}
        />
        <StatCard label="Biggest category" value={top ? top[0] : 'None'} hint={top ? `${formatGhs(top[1])} this month` : 'Nothing this month yet'} icon={Tag} tint="bg-amber-500/10 text-amber-600" loading={loading} failed={!!error} />
        <StatCard
          label="Recurring this month"
          value={formatGhs(recurring)}
          hint="Marked as repeating (rent, salaries…)"
          icon={Repeat}
          tint="bg-sky-500/10 text-sky-600"
          loading={loading}
          failed={!!error}
        />
        <StatCard label={`Capital spend ${now.getUTCFullYear()}`} value={formatGhs(capexYear)} hint="Not counted in the P&L" icon={Receipt} tint="bg-violet-500/10 text-violet-600" loading={loading} failed={!!error} />
      </div>

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="size-4" />
            Couldn’t load expenses: {error}
          </div>
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RotateCw />
            Retry
          </Button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={visible}
        isLoading={loading}
        getRowId={(e) => String(e.id)}
        initialSorting={[{ id: 'date', desc: true }]}
        searchPlaceholder="Search category, notes, paid by…"
        filters={[
          { columnId: 'category', title: 'Category', options: categories.map((c) => ({ value: c, label: c })) },
          {
            columnId: 'type',
            title: 'Type',
            options: [
              { value: 'opex', label: 'Operating' },
              { value: 'capex', label: 'Capital' },
            ],
          },
          { columnId: 'method', title: 'Method', options: [...EXPENSE_METHODS, { value: 'none', label: 'Not specified' }] },
        ]}
        toolbarStart={
          <Select value={range} onValueChange={(v) => setRange(v as Range)}>
            <SelectTrigger size="sm" className="h-8 w-auto gap-2">
              <CalendarDays className="size-4 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RANGES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        toolbarActions={(table) => {
          const rows = table.getFilteredRowModel().rows.map((r) => r.original);
          const total = rows.reduce((s, e) => s + amountOf(e), 0);
          return (
            <>
              <span className="hidden text-sm text-muted-foreground tabular-nums md:inline">
                Total <span className="font-medium text-foreground">{formatGhs(total)}</span>
              </span>
              <Button variant="outline" size="sm" className="h-8" disabled={!rows.length} onClick={() => exportCsv(rows)}>
                <Download />
                Export
              </Button>
              <Button size="sm" className="h-8" onClick={() => openDialog(null)}>
                <Plus />
                Add expense
              </Button>
            </>
          );
        }}
        emptyMessage={expenses.length === 0 ? 'No expenses recorded yet.' : 'No expenses in this range.'}
      />

      {dialog && <ExpenseDialog key={dialog.token} expense={dialog.expense} open={dialogOpen} onOpenChange={setDialogOpen} onSaved={() => void load()} />}

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this expense?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete && `${toDelete.category} · ${formatGhs(amountOf(toDelete))}. `}It’s removed from the P&L and can’t be recovered.
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

export default ExpensesTab;
