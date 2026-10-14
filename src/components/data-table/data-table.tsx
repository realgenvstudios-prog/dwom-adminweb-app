import { useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type FilterFn,
  type RowData,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { DataTablePagination } from './pagination';
import { DataTableToolbar, type FilterConfig } from './toolbar';

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    /** Label used in the "View" column toggle menu. */
    title?: string;
    className?: string;
  }
}

const searchFilterFn: FilterFn<unknown> = (row, columnId, value: string) =>
  String(row.getValue(columnId) ?? '')
    .toLowerCase()
    .includes(value.trim().toLowerCase());

interface DataTableProps<TData> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- columns mix value types
  columns: ColumnDef<TData, any>[];
  data: TData[];
  isLoading?: boolean;
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  /** Extra controls on the right of the toolbar (e.g. an "Add" button). */
  toolbarActions?: React.ReactNode;
  /** Shown in a floating bar while rows are selected. Requires a selectColumn(). */
  bulkActions?: (rows: TData[], clear: () => void) => React.ReactNode;
  onRowClick?: (row: TData) => void;
  getRowId?: (row: TData, index: number) => string;
  initialSorting?: SortingState;
  initialHidden?: VisibilityState;
  pageSize?: number;
  emptyMessage?: string;
}

export function DataTable<TData>({
  columns,
  data,
  isLoading = false,
  searchPlaceholder,
  filters,
  toolbarActions,
  bulkActions,
  onRowClick,
  getRowId,
  initialSorting = [],
  initialHidden = {},
  pageSize = 10,
  emptyMessage = 'No results.',
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>(initialSorting);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(initialHidden);
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState('');

  const enableRowSelection = columns.some((c) => c.id === 'select');

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, columnVisibility, rowSelection, globalFilter },
    initialState: { pagination: { pageSize } },
    enableRowSelection,
    getRowId,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: searchFilterFn as FilterFn<TData>,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    autoResetPageIndex: false,
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows.map((r) => r.original);
  const visibleColumnCount = table.getVisibleLeafColumns().length;

  const handleRowClick = (e: React.MouseEvent, row: TData) => {
    if (!onRowClick) return;
    const interactive = (e.target as HTMLElement).closest('button, a, input, select, textarea, [role="checkbox"], [role="menuitem"]');
    if (!interactive) onRowClick(row);
  };

  return (
    <div className="flex flex-col gap-4">
      <DataTableToolbar table={table} searchPlaceholder={searchPlaceholder} filters={filters} actions={toolbarActions} />

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan} className={header.column.columnDef.meta?.className}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: Math.min(pageSize, 8) }).map((_, i) => (
                <TableRow key={i} className="hover:bg-transparent">
                  {Array.from({ length: visibleColumnCount }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full max-w-32" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  onClick={(e) => handleRowClick(e, row.original)}
                  className={cn(onRowClick && 'cursor-pointer')}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className={cell.column.columnDef.meta?.className}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={visibleColumnCount} className="h-24 text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} />

      {bulkActions && selectedRows.length > 0 && (
        <div className="fixed inset-x-0 bottom-6 z-30 flex justify-center px-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2 rounded-xl border bg-background/95 p-2 shadow-lg backdrop-blur">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => table.resetRowSelection()}
              aria-label="Clear selection"
            >
              <X />
            </Button>
            <Separator orientation="vertical" className="data-[orientation=vertical]:h-5" />
            <span className="px-1 text-sm font-medium tabular-nums">{selectedRows.length} selected</span>
            <Separator orientation="vertical" className="data-[orientation=vertical]:h-5" />
            {bulkActions(selectedRows, () => table.resetRowSelection())}
          </div>
        </div>
      )}
    </div>
  );
}
