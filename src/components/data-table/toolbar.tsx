import type { Table } from '@tanstack/react-table';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTableFacetedFilter, type FacetOption } from './faceted-filter';
import { DataTableViewOptions } from './view-options';

export interface FilterConfig {
  columnId: string;
  title: string;
  options: FacetOption[];
}

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  start?: React.ReactNode;
  actions?: React.ReactNode;
}

export function DataTableToolbar<TData>({ table, searchPlaceholder, filters = [], start, actions }: DataTableToolbarProps<TData>) {
  const globalFilter = (table.getState().globalFilter as string) ?? '';
  const isFiltered = table.getState().columnFilters.length > 0 || globalFilter.length > 0;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {searchPlaceholder && (
          <div className="relative w-full sm:w-[250px]">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={globalFilter}
              onChange={(e) => table.setGlobalFilter(e.target.value)}
              className="h-8 pl-8"
            />
          </div>
        )}
        {start}
        {filters.map((f) =>
          table.getColumn(f.columnId) ? (
            <DataTableFacetedFilter key={f.columnId} column={table.getColumn(f.columnId)} title={f.title} options={f.options} />
          ) : null,
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 lg:px-3"
            onClick={() => {
              table.resetColumnFilters();
              table.setGlobalFilter('');
            }}
          >
            Reset
            <X className="size-4" />
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <DataTableViewOptions table={table} />
        {actions}
      </div>
    </div>
  );
}
