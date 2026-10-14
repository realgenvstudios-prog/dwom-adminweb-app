import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatGhs } from '../orders/order-status';
import type { DayPoint } from './useDashboard';

type Metric = 'orders' | 'paid' | 'gmv';

const METRICS: Record<Metric, { label: string; hint: string; money: boolean }> = {
  orders: { label: 'Orders', hint: 'Orders placed per day', money: false },
  paid: { label: 'Paid revenue', hint: 'Value of orders with payment received', money: true },
  gmv: { label: 'Order value', hint: 'Value of all orders placed, incl. unpaid', money: true },
};

const config: ChartConfig = {
  orders: { label: 'Orders', color: 'var(--chart-1)' },
  paid: { label: 'Paid revenue', color: 'var(--chart-1)' },
  gmv: { label: 'Order value', color: 'var(--chart-2)' },
};

function dayLabel(iso: string, long = false) {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString('en-GB', long ? { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'UTC' } : { weekday: 'short', timeZone: 'UTC' });
}

export default function WeekChart({ week, loading }: { week: DayPoint[] | null; loading: boolean }) {
  const [metric, setMetric] = useState<Metric>('orders');
  const m = METRICS[metric];
  const total = (week ?? []).reduce((sum, d) => sum + d[metric], 0);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Last 7 days</CardTitle>
        <CardDescription>
          {week ? (
            <>
              <span className="font-medium text-foreground tabular-nums">{m.money ? formatGhs(total) : total.toLocaleString()}</span> · {m.hint}
            </>
          ) : loading ? (
            'Loading…'
          ) : (
            'Couldn’t load the weekly trend'
          )}
        </CardDescription>
        <CardAction>
          <Tabs value={metric} onValueChange={(v) => setMetric(v as Metric)}>
            <TabsList className="h-8">
              {(Object.keys(METRICS) as Metric[]).map((k) => (
                <TabsTrigger key={k} value={k} className="px-2.5 text-xs">
                  {METRICS[k].label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardAction>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[240px] w-full" />
        ) : !week ? (
          <div className="flex h-[240px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
            No trend data right now.
          </div>
        ) : (
          <ChartContainer config={config} className="aspect-auto h-[240px] w-full">
            <BarChart data={week} margin={{ left: 0, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(v: string) => dayLabel(v)} />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={m.money ? 56 : 32}
                allowDecimals={false}
                tickFormatter={(v: number) => (m.money ? `₵${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}` : String(v))}
              />
              <ChartTooltip
                cursor={{ fill: 'var(--muted)', opacity: 0.6 }}
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) => dayLabel(String(payload?.[0]?.payload?.date ?? ''), true)}
                    formatter={(value) => (
                      <div className="flex w-full items-center justify-between gap-4">
                        <span className="text-muted-foreground">{m.label}</span>
                        <span className="font-medium tabular-nums">{m.money ? formatGhs(Number(value)) : Number(value).toLocaleString()}</span>
                      </div>
                    )}
                  />
                }
              />
              <Bar dataKey={metric} fill={`var(--color-${metric})`} radius={[4, 4, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
