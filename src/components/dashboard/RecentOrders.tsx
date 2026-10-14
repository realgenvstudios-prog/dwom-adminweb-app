import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Order } from '../orders/OrderTypes';
import { formatDateTime, formatGhs, orderStatusMeta } from '../orders/order-status';

interface RecentOrdersProps {
  orders: Order[];
  loading: boolean;
  error: string | null;
  /** False when the viewer's role can't open the Orders page. */
  linkable: boolean;
}

export default function RecentOrders({ orders, loading, error, linkable }: RecentOrdersProps) {
  const recent = orders.slice(0, 6);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Recent orders</CardTitle>
        <CardDescription>The latest orders as they come in</CardDescription>
        {linkable && (
          <CardAction>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/orders">
                View all
                <ArrowRight />
              </Link>
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-muted-foreground">Couldn’t load recent orders.</p>
        ) : recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">No orders yet.</p>
        ) : (
          <ul className="-mx-2">
            {recent.map((o) => {
              const s = orderStatusMeta(o.orderStatus);
              const row = (
                <div className="flex items-center gap-3 rounded-md px-2 py-2.5">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                    <s.icon className={cn('size-4', s.tone)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {o.customer}
                      <span className="ml-2 font-normal text-muted-foreground tabular-nums">#{o.id}</span>
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {s.label} · {formatDateTime(o.createdAt)}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-medium tabular-nums">{formatGhs(o.total)}</span>
                </div>
              );
              return (
                <li key={o.id}>
                  {linkable ? (
                    <Link to={`/orders?order=${o.id}`} className="block rounded-md transition-colors hover:bg-muted/60">
                      {row}
                    </Link>
                  ) : (
                    row
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
