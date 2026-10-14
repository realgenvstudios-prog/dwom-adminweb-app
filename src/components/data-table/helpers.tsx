import type { ColumnDef, FilterFn } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';

/** For columns driven by a faceted filter: keep rows whose value is one of the selected options. */
export const facetedFilterFn: FilterFn<unknown> = (row, columnId, value: string[]) =>
  value.includes(String(row.getValue(columnId)));

/** Checkbox column for row selection. */
export function selectColumn<TData>(): ColumnDef<TData> {
  return {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-0.5"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-0.5"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    meta: { className: 'w-10' },
  };
}

