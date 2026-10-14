import { useEffect, useState } from 'react';
import { Bar, CartesianGrid, ComposedChart, Line, ReferenceLine, XAxis, YAxis } from 'recharts';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import financeService, { type PnLBucket } from '../../../services/financeService';
import { formatGhs } from '../../orders/order-status';

type Period = 'daily' | 'weekly' | 'monthly';

// The API defaults every period to the last 30 days; ask for a span that
// suits each one instead.
const SPAN: Record<Period, { days: number; label: string }> = {
  daily: { days: 30, label: 'Last 30 days' },
  weekly: { days: 7 * 12, label: 'Last 12 weeks' },
  monthly: { days: 365, label: 'Last 12 months' },
};

const config: ChartConfig = {
  contribution: { label: 'Contribution', color: 'var(--chart-1)' },
  opex: { label: 'Operating costs', color: 'var(--chart-5)' },
  operatingResult: { label: 'Operating result', color: 'var(--chart-2)' },
};

function bucketLabel(period: Period, key: string) {
  const d = new Date(`${key.length === 7 ? `${key}-01` : key}T00:00:00Z`);
  if (period === 'monthly') return d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit', timeZone: 'UTC' });
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

export default function PnLChart() {
  const [period, setPeriod] = useState<Period>('weekly');
  const [rows, setRows] = useState<{ period: Period; data: PnLBucket[] } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const start = new Date(Date.now() - SPAN[period].days * 86_400_000).toISOString();
    financeService.getPeriodPnL(period, start).then((data) => !cancelled && setRows({ period, data: data ?? [] }));
    return () => {
      cancelled = true;
    };
  }, [period]);

  const loading = rows?.period !== period;
  const data = (rows?.data ?? []).map((b) => ({ ...b, opex: -b.opex, label: bucketLabel(period, b.period) }));
  const total = (rows?.data ?? []).reduce(
    (t, b) => ({ revenue: t.revenue + b.revenue, cogs: t.cogs + b.cogs, opex: t.opex + b.opex, result: t.result + b.operatingResult }),
    { revenue: 0, cogs: 0, opex: 0, result: 0 },
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profit & loss</CardTitle>
        <CardDescription>
          {SPAN[period].label} · paid orders only. Contribution = revenue − cost of goods; operating result also subtracts operating costs.
        </CardDescription>
        <CardAction>
          <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <TabsList className="h-8">
              <TabsTrigger value="daily" className="px-2.5 text-xs">Daily</TabsTrigger>
              <TabsTrigger value="weekly" className="px-2.5 text-xs">Weekly</TabsTrigger>
              <TabsTrigger value="monthly" className="px-2.5 text-xs">Monthly</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-4">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Revenue', value: total.revenue },
            { label: 'Cost of goods', value: -total.cogs },
            { label: 'Operating costs', value: -total.opex },
            { label: 'Operating result', value: total.result, emphasise: true },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border p-3">
              <dt className="text-xs text-muted-foreground">{s.label}</dt>
              <dd
                className={cn(
                  'mt-0.5 text-lg font-semibold tabular-nums',
                  s.emphasise && (s.value >= 0 ? 'text-emerald-600' : 'text-red-600'),
                )}
              >
                {loading ? <Skeleton className="h-6 w-20" /> : formatGhs(s.value)}
              </dd>
            </div>
          ))}
        </dl>
        {loading ? (
          <Skeleton className="h-[280px] w-full" />
        ) : data.length === 0 ? (
          <div className="flex h-[280px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">No paid orders or expenses in this period.</div>
        ) : (
          <ChartContainer config={config} className="aspect-auto h-[280px] w-full">
            <ComposedChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={16} />
              <YAxis tickLine={false} axisLine={false} width={56} tickFormatter={(v: number) => `₵${Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`} />
              <ReferenceLine y={0} stroke="var(--border)" />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => (
                      <div className="flex w-full items-center justify-between gap-4">
                        <span className="text-muted-foreground">{config[String(name)]?.label ?? String(name)}</span>
                        <span className="font-medium tabular-nums">{formatGhs(Number(value))}</span>
                      </div>
                    )}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="contribution" fill="var(--color-contribution)" radius={[3, 3, 0, 0]} maxBarSize={28} />
              <Bar dataKey="opex" fill="var(--color-opex)" radius={[0, 0, 3, 3]} maxBarSize={28} />
              <Line dataKey="operatingResult" stroke="var(--color-operatingResult)" strokeWidth={2} dot={false} type="monotone" />
            </ComposedChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
