import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CircleCheck, CircleX, Percent, Receipt, Repeat, ShoppingBag, TrendingUp, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/stat-card';
import { initialsOf } from '../customers/CustomerTypes';
import { formatGhs, paymentMethodMeta } from '../orders/order-status';
import PnLChart from './overview/PnLChart';
import RevenueChart from './overview/RevenueChart';
import { useFinanceOverview } from './overview/useFinanceOverview';

// Every KPI here is all-time (FinanceKpiService.getFinanceKPIs).
const OverviewTab: React.FC = () => {
  const { data, loading } = useFinanceOverview();
  const k = data?.kpis;
  const kFailed = !loading && !k;
  // The API's grossProfitMargin is the configured guess; when real costs
  // exist, the true margin is gross profit over net revenue.
  const margin = k ? (k.grossProfitIsEstimate || !k.netRevenue ? k.grossProfitMargin : (k.grossProfit / k.netRevenue) * 100) : 0;

  const zones = data?.zones ?? [];
  const zoneTotal = zones.reduce((s, z) => s + z.revenue, 0);
  const unassigned = zones.find((z) => z.zone === 'Unassigned')?.revenue ?? 0;

  const checks: { tone: 'warn' | 'bad'; text: React.ReactNode }[] = [];
  if (k?.grossProfitIsEstimate) {
    checks.push({
      tone: 'warn',
      text: (
        <>
          Gross profit is an estimate ({k.grossProfitMargin}% assumed margin) because no product costs are recorded.{' '}
          <Link to="/finance?tab=productCosts" className="underline underline-offset-2">
            Add product costs
          </Link>
          .
        </>
      ),
    });
  }
  if (k && k.failedPaymentRate > 0.05) checks.push({ tone: 'bad', text: `${(k.failedPaymentRate * 100).toFixed(1)}% of all orders have a failed payment.` });
  if (zoneTotal > 0 && unassigned / zoneTotal > 0.1) {
    checks.push({ tone: 'warn', text: `${Math.round((unassigned / zoneTotal) * 100)}% of paid revenue isn’t linked to a zone, so the zone breakdown is incomplete.` });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Net revenue" value={formatGhs(k?.netRevenue)} hint="Paid orders, all time" icon={Wallet} tint="bg-emerald-500/10 text-emerald-600" loading={loading} failed={kFailed} />
        <StatCard label="Order value (GMV)" value={formatGhs(k?.gmv)} hint="Every order placed, incl. unpaid" icon={ShoppingBag} tint="bg-sky-500/10 text-sky-600" loading={loading} failed={kFailed} />
        <StatCard
          label={k?.grossProfitIsEstimate ? 'Gross profit (est.)' : 'Gross profit'}
          value={formatGhs(k?.grossProfit)}
          hint={k?.grossProfitIsEstimate ? 'No product costs recorded yet' : 'Net revenue − recorded costs'}
          icon={TrendingUp}
          tint="bg-violet-500/10 text-violet-600"
          loading={loading}
          failed={kFailed}
        />
        <StatCard
          label={k?.grossProfitIsEstimate ? 'Gross margin (assumed)' : 'Gross margin'}
          value={`${margin.toFixed(1)}%`}
          hint={k?.grossProfitIsEstimate ? 'Set in Finance › Settings' : 'Gross profit ÷ net revenue'}
          icon={Percent}
          tint="bg-amber-500/10 text-amber-600"
          loading={loading}
          failed={kFailed}
        />
        <StatCard label="Avg paid order" value={formatGhs(k?.avgOrderValue)} hint="Net revenue ÷ paid orders" icon={Receipt} tint="bg-sky-500/10 text-sky-600" loading={loading} failed={kFailed} />
        <StatCard label="MRR" value={formatGhs(k?.mrr)} hint="Active subscription baskets, per month" icon={Repeat} tint="bg-emerald-500/10 text-emerald-600" loading={loading} failed={kFailed} />
        <StatCard label="Active subscriptions" value={String(k?.activeSubscriptions ?? 0)} hint="Active and due to bill" icon={Repeat} tint="bg-violet-500/10 text-violet-600" loading={loading} failed={kFailed} />
        <StatCard
          label="Failed payments"
          value={`${((k?.failedPaymentRate ?? 0) * 100).toFixed(1)}%`}
          hint="Of all orders"
          icon={CircleX}
          tint="bg-red-500/10 text-red-600"
          loading={loading}
          failed={kFailed}
        />
      </div>

      <PnLChart />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart days={data?.days ?? null} loading={loading} />
        </div>
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Revenue by zone</CardTitle>
            <CardDescription>Paid orders, all time</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-48 w-full" />
            ) : zones.length === 0 ? (
              <p className="text-sm text-muted-foreground">No paid orders yet.</p>
            ) : (
              <ul className="space-y-3">
                {zones.slice(0, 7).map((z) => (
                  <li key={z.zone} className="space-y-1.5">
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className={z.zone === 'Unassigned' ? 'text-muted-foreground italic' : 'font-medium'}>{z.zone}</span>
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
            <CardDescription>By paid spend, all time</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-48 w-full" />
            ) : !data?.customers?.length ? (
              <p className="text-sm text-muted-foreground">No paying customers yet.</p>
            ) : (
              <ol className="space-y-3">
                {data.customers.map((c) => (
                  <li key={c.id} className="flex items-center gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">{initialsOf(c.name)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.totalOrders} orders</p>
                    </div>
                    <span className="text-sm font-medium tabular-nums">{formatGhs(c.totalSpend)}</span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Failed payments</CardTitle>
            <CardDescription>Among the 50 most recent orders</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-48 w-full" />
            ) : !data?.failed?.length ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CircleCheck className="size-4 text-emerald-600" />
                None recently.
              </div>
            ) : (
              <ul className="space-y-3">
                {data.failed.map((p, i) => {
                  const m = paymentMethodMeta(p.method);
                  return (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <m.icon className="size-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{p.customer}</p>
                        <p className="text-xs text-muted-foreground">{p.date}</p>
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
            {k && (
              <Badge variant="outline" className="mt-4 font-normal text-muted-foreground">
                KPIs are all-time
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OverviewTab;
