import { Link } from 'react-router-dom';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Order } from '../orders/OrderTypes';
import { orderStatusMeta } from '../orders/order-status';

const STAGES = ['placed', 'accepted', 'sorting', 'ready', 'rider on the way', 'rider has arrived'];
const BAR: Record<string, string> = {
  placed: 'bg-slate-500',
  accepted: 'bg-teal-500',
  sorting: 'bg-sky-500',
  ready: 'bg-amber-500',
  'rider on the way': 'bg-violet-500',
  'rider has arrived': 'bg-orange-500',
};

interface OrderPipelineProps {
  orders: Order[];
  loading: boolean;
  error: string | null;
  linkable: boolean;
}

/** Orders still in flight (not delivered/cancelled), by stage. */
export default function OrderPipeline({ orders, loading, error, linkable }: OrderPipelineProps) {
  const active = orders.filter((o) => STAGES.includes(o.orderStatus));
  const counts = STAGES.map((s) => ({ stage: s, count: active.filter((o) => o.orderStatus === s).length }));
  const noRider = active.filter((o) => !o.rider).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live orders</CardTitle>
        <CardDescription>
          {loading
            ? 'Loading…'
            : error
              ? 'Couldn’t load orders'
              : active.length === 0
                ? 'Nothing in progress right now'
                : `${active.length} in progress${noRider ? ` · ${noRider} without a rider` : ''}`}
        </CardDescription>
        {linkable && (
          <CardAction>
            <Link to="/orders" className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
              Open orders
            </Link>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <Skeleton className="h-20 w-full" />
        ) : (
          <>
            <div className="flex h-2 overflow-hidden rounded-full bg-muted">
              {active.length > 0 &&
                counts.map(
                  ({ stage, count }) =>
                    count > 0 && (
                      <div
                        key={stage}
                        className={cn('h-full transition-all', BAR[stage])}
                        style={{ width: `${(count / active.length) * 100}%` }}
                      />
                    ),
                )}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {counts.map(({ stage, count }) => {
                const s = orderStatusMeta(stage);
                return (
                  <div key={stage} className="rounded-lg border p-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className={cn('size-2 rounded-full', BAR[stage])} />
                      {s.label}
                    </div>
                    <p className={cn('mt-1 text-2xl font-semibold tabular-nums', count === 0 && 'text-muted-foreground/50')}>{count}</p>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
