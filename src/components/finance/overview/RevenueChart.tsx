import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { formatGhs } from '../../orders/order-status';
import type { DayPoint } from './useFinanceOverview';

const config: ChartConfig = {
  gmv: { label: 'Order value', color: 'var(--chart-2)' },
  paid: { label: 'Paid revenue', color: 'var(--chart-1)' },
};

const dayLabel = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

export default function RevenueChart({ days, loading }: { days: DayPoint[] | null; loading: boolean }) {
  const paid = (days ?? []).reduce((s, d) => s + d.paid, 0);
  const gmv = (days ?? []).reduce((s, d) => s + d.gmv, 0);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Revenue, last 30 days</CardTitle>
        <CardDescription>
          {days ? (
            <>
              <span className="font-medium text-foreground tabular-nums">{formatGhs(paid)}</span> paid of {formatGhs(gmv)} ordered
              {gmv > 0 && <> · {Math.round((paid / gmv) * 100)}% collected</>}
            </>
          ) : loading ? (
            'Loading…'
          ) : (
            'Couldn’t load revenue'
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[260px] w-full" />
        ) : !days ? (
          <div className="flex h-[260px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">No data right now.</div>
        ) : (
          <ChartContainer config={config} className="aspect-auto h-[260px] w-full">
            <AreaChart data={days} margin={{ left: 0, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="fill-paid" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-paid)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--color-paid)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} tickFormatter={dayLabel} />
              <YAxis tickLine={false} axisLine={false} width={56} tickFormatter={(v: number) => `₵${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, p) => dayLabel(String(p?.[0]?.payload?.date ?? ''))}
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
              <Area dataKey="gmv" type="monotone" stroke="var(--color-gmv)" fill="transparent" strokeWidth={1.5} strokeDasharray="4 4" />
              <Area dataKey="paid" type="monotone" stroke="var(--color-paid)" fill="url(#fill-paid)" strokeWidth={2} />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
