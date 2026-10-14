import { Package, StickyNote } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { OrderItem } from '../OrderTypes';
import { formatGhs } from '../order-status';

interface ItemsTabProps {
  items: OrderItem[];
  loading: boolean;
  error: string | null;
}

export default function ItemsTab({ items, loading, error }: ItemsTabProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }
  if (error) return <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</p>;
  if (items.length === 0) return <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">No items on this order.</p>;

  return (
    <ul className="divide-y overflow-hidden rounded-lg border">
      {items.map((item) => (
        <li key={item.id} className="px-4 py-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-6 min-w-6 items-center justify-center rounded-md bg-muted px-1.5 text-xs font-medium tabular-nums">
                {item.quantity}×
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{item.name}</p>
                {item.isBundle && (
                  <Badge variant="secondary" className="mt-1 gap-1 font-normal">
                    <Package className="size-3" />
                    Bundle
                  </Badge>
                )}
              </div>
            </div>
            <div className="shrink-0 text-right text-sm tabular-nums">
              {item.originalPrice && <div className="text-xs text-muted-foreground line-through">{formatGhs(item.originalPrice)}</div>}
              <div className="font-medium">{formatGhs(item.price)}</div>
            </div>
          </div>
          {item.notes && (
            <div className="mt-2 flex items-start gap-2 rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-800">
              <StickyNote className="mt-px size-3.5 shrink-0" />
              <span>{item.notes}</span>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
