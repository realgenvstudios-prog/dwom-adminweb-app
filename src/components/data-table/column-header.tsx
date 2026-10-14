import type { Column } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ChevronsUpDown, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface DataTableColumnHeaderProps<TData, TValue> extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort() && !column.getCanHide()) {
    return <div className={cn(className)}>{title}</div>;
  }

  const sorted = column.getIsSorted();

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="-ml-2.5 h-8 data-[state=open]:bg-accent">
            <span>{title}</span>
            {sorted === 'desc' ? (
              <ArrowDown className="size-3.5" />
            ) : sorted === 'asc' ? (
              <ArrowUp className="size-3.5" />
            ) : column.getCanSort() ? (
              <ChevronsUpDown className="size-3.5 text-muted-foreground" />
            ) : null}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {column.getCanSort() && (
            <>
              <DropdownMenuItem onSelect={() => column.toggleSorting(false)}>
                <ArrowUp className="text-muted-foreground" />
                Asc
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => column.toggleSorting(true)}>
                <ArrowDown className="text-muted-foreground" />
                Desc
              </DropdownMenuItem>
            </>
          )}
          {column.getCanSort() && column.getCanHide() && <DropdownMenuSeparator />}
          {column.getCanHide() && (
            <DropdownMenuItem onSelect={() => column.toggleVisibility(false)}>
              <EyeOff className="text-muted-foreground" />
              Hide
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
