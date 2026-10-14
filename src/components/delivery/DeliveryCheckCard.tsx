import { useState } from 'react';
import { CircleCheck, CircleX, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import deliveryService, { type DeliveryCheckResult } from '../../services/deliveryService';
import { logger } from '../../utils/logger';
import { formatGhs } from '../orders/order-status';
import { num } from '../riders/rider-meta';
import PlaceSearch from './PlaceSearch';

/** Runs the same deliverability check the app runs at checkout. */
export default function DeliveryCheckCard() {
  const [result, setResult] = useState<DeliveryCheckResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Check an address</CardTitle>
        <CardDescription>Would a customer here be able to order, and what would delivery cost?</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <PlaceSearch
          showPickedLabel={false}
          onPick={async ({ lat, lng }) => {
            setChecking(true);
            setFailed(false);
            setResult(null);
            try {
              setResult(await deliveryService.checkDelivery(lat, lng));
            } catch (err) {
              logger.error('Delivery check failed:', err);
              setFailed(true);
            } finally {
              setChecking(false);
            }
          }}
        />
        {checking && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Checking…
          </p>
        )}
        {failed && <p className="text-sm text-destructive">The check failed. Try again.</p>}
        {result && (
          <div
            className={cn(
              'flex items-start gap-3 rounded-lg border p-3 text-sm',
              result.deliverable ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-red-500/30 bg-red-500/10',
            )}
          >
            {result.deliverable ? <CircleCheck className="mt-0.5 size-5 shrink-0 text-emerald-600" /> : <CircleX className="mt-0.5 size-5 shrink-0 text-red-600" />}
            <div>
              <p className="font-medium">{result.deliverable ? 'Deliverable' : 'Not deliverable'}</p>
              <p className="text-muted-foreground">{result.message}</p>
              {result.deliverable && (
                <p className="mt-1">
                  Delivery fee <strong className="tabular-nums">{formatGhs(num(result.deliveryFee))}</strong>
                  {result.zone && <span className="text-muted-foreground"> · {result.zone.name}</span>}
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
