import { Star } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { OrderDetails } from './useOrderDetails';

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={cn('size-4', i < rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30')} />
      ))}
    </div>
  );
}

export default function FeedbackTab({ details, loading }: { details: OrderDetails | null; loading: boolean }) {
  if (loading) return <Skeleton className="h-24 w-full" />;
  const rider = details?.riderRating;
  const reviews = details?.productReviews ?? [];

  if (!rider && reviews.length === 0) {
    return <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">The customer hasn’t left any feedback on this order.</p>;
  }

  return (
    <div className="space-y-6">
      {rider && (
        <section className="space-y-3">
          <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Rider rating</h3>
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <Stars rating={rider.rating} />
              <span className="text-sm font-medium tabular-nums">{rider.rating}/5</span>
            </div>
            {rider.comment && <p className="mt-2 text-sm text-muted-foreground italic">“{rider.comment}”</p>}
          </div>
        </section>
      )}
      {reviews.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Product reviews</h3>
          <ul className="divide-y rounded-lg border">
            {reviews.map((r) => (
              <li key={r.productId} className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-medium">{r.productName}</span>
                  <Stars rating={r.rating} />
                </div>
                {r.comment && <p className="mt-1 text-sm text-muted-foreground italic">“{r.comment}”</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
