import { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import dashboardService, { type PopularProduct } from '../../services/dashboardService';
import { POPULAR_ITEMS_LIMIT } from '../../constants/limits';
import { formatGhs } from '../orders/order-status';

// Backend (AdminStatsService.getTopProducts) ranks single products by units
// across every order ever placed, cancelled included; bundles aren't counted.
export default function TopSellers({ refreshKey }: { refreshKey: number }) {
  const [products, setProducts] = useState<PopularProduct[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    dashboardService.getPopularProducts(POPULAR_ITEMS_LIMIT).then((p) => !cancelled && setProducts(p));
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const top = products?.[0]?.quantity || 1;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Top sellers</CardTitle>
        <CardDescription>All time, by units ordered · products only</CardDescription>
      </CardHeader>
      <CardContent>
        {products === null ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sales yet — top products will show up once orders come in.</p>
        ) : (
          <ol className="space-y-4">
            {products.map((p, i) => (
              <li key={p.id} className="flex items-center gap-3">
                <span className="w-4 text-right text-xs text-muted-foreground tabular-nums">{i + 1}</span>
                <div className="size-10 shrink-0 overflow-hidden rounded-md border bg-muted">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt="" className="size-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <ImageOff className="size-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate text-sm font-medium">{p.nameEnglish}</p>
                    <p className="shrink-0 text-xs text-muted-foreground tabular-nums">{p.quantity.toLocaleString()} units</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary/70" style={{ width: `${Math.max((p.quantity / top) * 100, 4)}%` }} />
                    </div>
                    <span className="w-24 shrink-0 text-right text-xs text-muted-foreground tabular-nums">{formatGhs(p.revenue)}</span>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
