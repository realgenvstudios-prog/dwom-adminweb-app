import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ordersService, { type OrderChangesSummary } from '../../services/ordersService';
import { logger } from '../../utils/logger';
import { formatGhs } from '../orders/order-status';

// Money moved by changes after ordering. Order totals in the P&L already
// include these; this shows what's behind them.
export default function OrderChangesCard() {
  const [data, setData] = useState<OrderChangesSummary | null>(null);

  useEffect(() => {
    ordersService
      .getChangesSummary()
      .then(setData)
      .catch((err) => logger.warn('Order changes summary unavailable:', err));
  }, []);

  if (!data) return null;
  const rows = [
    { label: 'Refunds to send', value: data.refundsToSend, warn: data.refundsToSend.count > 0 },
    { label: 'Refunds sent', value: data.refundsSent },
    { label: 'Extra paid online', value: data.paidOnlineExtra },
    { label: 'Extra paid at the door', value: data.atDoorExtra },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order changes</CardTitle>
        <CardDescription>The last {data.days} days. {data.ordersWithAddedItems} order{data.ordersWithAddedItems === 1 ? '' : 's'} had items added.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <dl className="divide-y rounded-lg border text-sm">
          {rows.map((r) => (
            <div key={r.label} className="flex justify-between gap-3 px-4 py-2">
              <dt className={r.warn ? 'font-medium text-amber-700' : 'text-muted-foreground'}>
                {r.label} ({r.value.count})
              </dt>
              <dd className="font-medium tabular-nums">{formatGhs(r.value.amount)}</dd>
            </div>
          ))}
        </dl>
        <div className="rounded-lg border px-4 py-3 text-sm">
          <p className="mb-2 font-medium">Most often unavailable</p>
          {data.mostUnavailable.length === 0 ? (
            <p className="text-muted-foreground">Nothing marked unavailable.</p>
          ) : (
            <ul className="space-y-1">
              {data.mostUnavailable.map((i) => (
                <li key={i.name} className="flex justify-between gap-3 text-muted-foreground">
                  <span className="truncate">{i.name}</span>
                  <span className="tabular-nums">{i.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
