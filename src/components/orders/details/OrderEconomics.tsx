import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import adminApiClient from '../../../services/apiClient';
import { logger } from '../../../utils/logger';
import { formatGhs } from '../order-status';

interface OrderCostBreakdown {
  productCost: number;
  kayayieCost: number;
  riderCost: number;
  packagingCost: number;
  paymentFeeEstimate: number;
  totalCost: number;
  contribution: number;
}

// Mounted with key={orderId}, so each order starts from fresh loading state.
// Real cost of fulfilling this order (CostCalculationService). Picker/rider
// cost read 0 until Trip tracking feeds them — shown as "not tracked yet",
// never estimated.
export default function OrderEconomics({ orderId }: { orderId: string }) {
  const [data, setData] = useState<OrderCostBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    adminApiClient
      .get<OrderCostBreakdown>(`/admin/finance/orders/${orderId}/cost-breakdown`)
      .then((d) => !cancelled && setData(d))
      .catch((err) => {
        logger.error('Failed to fetch order cost breakdown:', err);
        if (!cancelled) setError(true);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (loading) return <Skeleton className="h-40 w-full" />;
  if (error || !data) {
    return <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Cost breakdown isn’t available for this order.</p>;
  }

  const rows = [
    { label: 'Product cost', value: data.productCost },
    { label: 'Picker cost', value: data.kayayieCost, untracked: data.kayayieCost === 0 },
    { label: 'Rider cost', value: data.riderCost, untracked: data.riderCost === 0 },
    { label: 'Packaging', value: data.packagingCost },
    { label: 'Payment fee (est.)', value: data.paymentFeeEstimate },
  ];
  const positive = data.contribution >= 0;

  return (
    <div className="overflow-hidden rounded-lg border text-sm">
      <dl className="divide-y">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between px-4 py-2">
            <dt className="text-muted-foreground">
              {r.label}
              {r.untracked && <span className="ml-1 text-xs">(not tracked yet)</span>}
            </dt>
            <dd className="tabular-nums">{formatGhs(r.value)}</dd>
          </div>
        ))}
        <div className="flex items-center justify-between bg-muted/50 px-4 py-2 font-medium">
          <dt>Total cost</dt>
          <dd className="tabular-nums">{formatGhs(data.totalCost)}</dd>
        </div>
        <div
          className={cn(
            'flex items-center justify-between px-4 py-2 font-semibold',
            positive ? 'bg-emerald-500/10 text-emerald-700' : 'bg-red-500/10 text-red-700',
          )}
        >
          <dt>Contribution</dt>
          <dd className="tabular-nums">{formatGhs(data.contribution)}</dd>
        </div>
      </dl>
    </div>
  );
}
