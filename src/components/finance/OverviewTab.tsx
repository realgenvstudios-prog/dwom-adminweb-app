import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CircleCheck, CircleX, Percent, Receipt, Repeat, ShoppingBag, TrendingUp, UserPlus, Wallet } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/stat-card';
import { initialsOf } from '../customers/CustomerTypes';
import { formatGhs, paymentMethodMeta } from '../orders/order-status';
import PeriodBar from './overview/PeriodBar';
import PnLChart from './overview/PnLChart';
import RevenueChart from './overview/RevenueChart';
import { rangeOf } from './overview/period';
import { usePeriodParam } from './overview/use-period-param';
import { useFinanceOverview } from './overview/useFinanceOverview';

/** Percent change from the comparison period; null when there's nothing to compare with. */
const change = (cur: number | undefined, prev: number | undefined) => (cur === undefined || prev === undefined || prev === 0 ? null : ((cur - prev) / Math.abs(prev)) * 100);

const shortDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

// Every figure follows the period chosen at the top, except MRR and active
// subscriptions, which are always "as of now".
const OverviewTab: React.FC = () => {
  const [period, setPeriod] = usePeriodParam();
  const range = rangeOf(period);
  const { data, loading, error } = useFinanceOverview(range);
  const cur = data?.current;
  const prev = data?.previous ?? undefined;
  const failed = !loading && !data;
  // With real costs, the true margin is gross profit over net revenue;
  // otherwise it's the configured assumption.
  const margin = cur ? (cur.grossProfitIsEstimate || !cur.netRevenue ? (data?.grossProfitMargin ?? 0) : (cur.grossProfit / cur.netRevenue) * 100) : 0;

  const zones = data?.zones ?? [];
  const zoneTotal = zones.reduce((s, z) => s + z.revenue, 0);
  const unassigned = zones.find((z) => z.zoneId === null)?.revenue ?? 0;

  const checks: { tone: 'warn' | 'bad'; text: React.ReactNode }[] = [];
  if (cur?.grossProfitIsEstimate) {
    checks.push({
      tone: 'warn',
      text: (
        <>
          Gross profit is an estimate ({data?.grossProfitMargin}% assumed margin) because no product costs are recorded for this period’s orders.{' '}
          <Link to="/finance?tab=productCosts" className="underline underline-offset-2">
            Add product costs
          </Link>
          .
        </>
      ),
    });
  }
  if (cur && cur.failedPaymentRate > 0.05) checks.push({ tone: 'bad', text: `${(cur.failedPaymentRate * 100).toFixed(1)}% of this period’s orders have a failed payment.` });
  if (zoneTotal > 0 && unassigned / zoneTotal > 0.1) {
    checks.push({ tone: 'warn', text: `${Math.round((unassigned / zoneTotal) * 100)}% of paid revenue isn’t linked to a zone, so the zone breakdown is incomplete.` });
  }

  const compareNote =
    range.compareLabel && data?.previousRange
      ? `Changes are ${range.compareLabel} (${shortDate(data.previousRange.start)} – ${shortDate(data.previousRange.end)}).`
      : period.mode === 'all'
        ? 'All time has nothing to compare with.'
        : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-2">
        <PeriodBar value={period} onChange={setPeriod} />
        {(compareNote || error) && <p className="px-1 text-xs text-muted-foreground">{error ? <span className="text-destructive">Couldn’t load: {error}</span> : compareNote}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Net revenue"
          value={formatGhs(cur?.netRevenue)}
          hint={cur ? `${cur.paidOrders.toLocaleString()} paid order${cur.paidOrders === 1 ? '' : 's'}` : undefined}
          change={change(cur?.netRevenue, prev?.netRevenue)}
          icon={Wallet}
          tint="bg-emerald-500/10 text-emerald-600"
          loading={loading}
          failed={failed}
        />
        <StatCard
          label="Order value (GMV)"
          value={formatGhs(cur?.gmv)}
          hint={cur ? `${cur.orders.toLocaleString()} orders, incl. unpaid` : undefined}
          change={change(cur?.gmv, prev?.gmv)}
          icon={ShoppingBag}
          tint="bg-sky-500/10 text-sky-600"
          loading={loading}
          failed={failed}
        />
        <StatCard
          label={cur?.grossProfitIsEstimate ? 'Gross profit (est.)' : 'Gross profit'}
          value={formatGhs(cur?.grossProfit)}
          hint={cur?.grossProfitIsEstimate ? 'No product costs recorded' : 'Net revenue − costs'}
          change={change(cur?.grossProfit, prev?.grossProfit)}
          icon={TrendingUp}
          tint="bg-violet-500/10 text-violet-600"
          loading={loading}
          failed={failed}
        />
        <StatCard
          label={cur?.grossProfitIsEstimate ? 'Gross margin (assumed)' : 'Gross margin'}
          value={`${margin.toFixed(1)}%`}
          hint={cur?.grossProfitIsEstimate ? 'Set in Finance › Settings' : 'Gross profit ÷ net revenue'}
          icon={Percent}
          tint="bg-amber-500/10 text-amber-600"
          loading={loading}
          failed={failed}
        />
        <StatCard
          label="Avg paid order"
          value={formatGhs(cur?.avgOrderValue)}
          hint="Net revenue ÷ paid orders"
          change={change(cur?.avgOrderValue, prev?.avgOrderValue)}
          icon={Receipt}
          tint="bg-sky-500/10 text-sky-600"
          loading={loading}
          failed={failed}
        />
        <StatCard
          label="New paying customers"
          value={(cur?.newCustomers ?? 0).toLocaleString()}
          hint="First paid order in this period"
          change={change(cur?.newCustomers, prev?.newCustomers)}
          icon={UserPlus}
          tint="bg-emerald-500/10 text-emerald-600"
          loading={loading}
          failed={failed}
        />
        <StatCard
          label="MRR"
          value={formatGhs(data?.mrr)}
          hint={data ? `${data.activeSubscriptions} active subscription${data.activeSubscriptions === 1 ? '' : 's'} · as of now` : 'As of now'}
          icon={Repeat}
          tint="bg-violet-500/10 text-violet-600"
          loading={loading}
          failed={failed}
        />
        <StatCard
          label="Failed payments"
          value={`${((cur?.failedPaymentRate ?? 0) * 100).toFixed(1)}%`}
          hint={cur ? `${cur.failedOrders.toLocaleString()} of ${cur.orders.toLocaleString()} orders` : undefined}
          icon={CircleX}
          tint="bg-red-500/10 text-red-600"
          loading={loading}
          failed={failed}
        />
      </div>

      <PnLChart key={`${range.start}-${range.end}`} range={range} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart series={data?.series ?? null} granularity={data?.granularity ?? 'day'} periodLabel={range.label} loading={loading} />
        </div>
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Revenue by zone</CardTitle>
            <CardDescription>Paid orders · {range.label}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-48 w-full" />
            ) : zones.length === 0 ? (
              <p className="text-sm text-muted-foreground">No paid orders in this period.</p>
            ) : (
              <ul className="space-y-3">
                {zones.slice(0, 7).map((z) => (
                  <li key={z.zoneId ?? 'none'} className="space-y-1.5">
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className={z.zoneId === null ? 'text-muted-foreground italic' : 'font-medium'}>{z.zoneName}</span>
                      <span className="tabular-nums">{formatGhs(z.revenue)}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-chart-1" style={{ width: `${Math.max((z.revenue / (zones[0].revenue || 1)) * 100, 3)}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Top customers</CardTitle>
            <CardDescription>By paid spend · {range.label}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-48 w-full" />
            ) : !data?.topCustomers.length ? (
              <p className="text-sm text-muted-foreground">No paying customers in this period.</p>
            ) : (
              <ol className="space-y-3">
                {data.topCustomers.map((c) => (
                  <li key={c.id} className="flex items-center gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">{initialsOf(c.name)}</span>
                    <div className="min-w-0 flex-1">
                      <Link to={`/customers?customer=${c.id}`} className="block truncate text-sm font-medium hover:underline">
                        {c.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {c.paidOrders} paid order{c.paidOrders === 1 ? '' : 's'}
                      </p>
                    </div>
                    <span className="text-sm font-medium tabular-nums">{formatGhs(c.spend)}</span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Failed payments</CardTitle>
            <CardDescription>Most recent · {range.label}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-48 w-full" />
            ) : !data?.failedPayments.length ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CircleCheck className="size-4 text-emerald-600" />
                None in this period.
              </div>
            ) : (
              <ul className="space-y-3">
                {data.failedPayments.map((p) => {
                  const m = paymentMethodMeta(p.method);
                  return (
                    <li key={p.orderId} className="flex items-center gap-3 text-sm">
                      <m.icon className="size-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <Link to={`/orders?order=${p.orderId}`} className="block truncate font-medium hover:underline">
                          {p.customer}
                        </Link>
                        <p className="text-xs text-muted-foreground">{shortDate(p.createdAt)}</p>
                      </div>
                      <span className="tabular-nums">{formatGhs(p.amount)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Things to check</CardTitle>
            <CardDescription>Gaps that make these numbers less reliable</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-24 w-full" />
            ) : checks.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CircleCheck className="size-4 text-emerald-600" />
                Nothing stands out.
              </div>
            ) : (
              <ul className="space-y-2">
                {checks.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <AlertTriangle className={`mt-0.5 size-4 shrink-0 ${c.tone === 'bad' ? 'text-red-600' : 'text-amber-600'}`} />
                    <span>{c.text}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OverviewTab;
