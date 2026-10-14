import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts';
import { Banknote, CalendarDays, Repeat, ShoppingBasket, ShoppingCart, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/stat-card';
import type { OrderInsights } from '../../services/analyticsService';
import { formatGhs } from '../orders/order-status';

const ordersConfig: ChartConfig = { orders: { label: 'Orders', color: 'var(--chart-1)' } };
const hourLabel = (h: number) => `${String(h).padStart(2, '0')}:00`;
const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);
const METHOD_LABEL: Record<string, string> = { cash: 'Cash on delivery', card: 'Card', momo: 'Mobile money', unknown: 'Unknown' };

/** The 3-hour window with the most orders, e.g. "12:00–15:00". */
function peakWindow(byHour: { hour: number; orders: number }[]) {
  let best = { start: 0, orders: -1 };
  for (let h = 0; h < 24; h++) {
    const sum = [0, 1, 2].reduce((t, k) => t + (byHour[(h + k) % 24]?.orders ?? 0), 0);
    if (sum > best.orders) best = { start: h, orders: sum };
  }
  return best;
}

function Empty({ text = 'No orders in this range.' }: { text?: string }) {
  return <div className="flex h-[220px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">{text}</div>;
}

export default function OrdersInsightsTab({ data, loading, failed }: { data: OrderInsights | null; loading: boolean; failed: boolean }) {
  const t = data?.totals;
  const hasOrders = (t?.customerPlaced ?? 0) > 0;
  const busiestDay = data && hasOrders ? [...data.byWeekday].sort((a, b) => b.orders - a.orders)[0] : null;
  const quietestDay = data && hasOrders ? [...data.byWeekday].sort((a, b) => a.orders - b.orders)[0] : null;
  const peak = data && hasOrders ? peakWindow(data.byHour) : null;
  const maxCell = data ? Math.max(1, ...data.heatmap.flat()) : 1;
  const topBucket = data ? [...data.basketBuckets].sort((a, b) => b.orders - a.orders)[0] : null;
  const maxBucket = data ? Math.max(1, ...data.basketBuckets.map((b) => b.orders)) : 1;
  // Monday-first reads more naturally for a working week.
  const weekdays = data ? [...data.byWeekday.slice(1), data.byWeekday[0]] : [];
  const heatRows = data ? [1, 2, 3, 4, 5, 6, 0].map((d) => ({ day: data.byWeekday[d].day, cells: data.heatmap[d] })) : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Orders" value={(t?.orders ?? 0).toLocaleString()} hint={t ? `${t.ordersPerDay} a day on average` : undefined} icon={ShoppingCart} tint="bg-sky-500/10 text-sky-600" loading={loading} failed={failed} />
        <StatCard label="Average basket" value={formatGhs(t?.avgBasket ?? 0)} hint={t ? `Half are under ${formatGhs(t.medianBasket)} (goods only)` : undefined} icon={ShoppingBasket} tint="bg-emerald-500/10 text-emerald-600" loading={loading} failed={failed} />
        <StatCard label="Average order" value={formatGhs(t?.avgOrderValue ?? 0)} hint="What customers paid, with fees" icon={Banknote} tint="bg-violet-500/10 text-violet-600" loading={loading} failed={failed} />
        <StatCard label="Items per order" value={String(t?.avgItems ?? 0)} hint="Units, on average" icon={CalendarDays} tint="bg-amber-500/10 text-amber-600" loading={loading} failed={failed} />
        <StatCard
          label="From returning customers"
          value={`${pct(t?.returningOrders ?? 0, t?.orders ?? 0)}%`}
          hint={t ? `${t.newCustomers} new customer${t.newCustomers === 1 ? '' : 's'} in this range` : undefined}
          icon={Repeat}
          tint="bg-teal-500/10 text-teal-600"
          loading={loading}
          failed={failed}
        />
        <StatCard label="Cancelled" value={`${t?.cancellationRate ?? 0}%`} hint={t ? `${t.cancelled} order${t.cancelled === 1 ? '' : 's'}` : undefined} icon={XCircle} tint="bg-red-500/10 text-red-600" loading={loading} failed={failed} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Busiest days</CardTitle>
            <CardDescription>
              {busiestDay && quietestDay ? (
                <>
                  <span className="font-medium text-foreground">{busiestDay.day}</span> is your busiest day; {quietestDay.day} the quietest.
                </>
              ) : (
                'Orders customers placed, by day of the week'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[220px] w-full" />
            ) : !hasOrders ? (
              <Empty />
            ) : (
              <ChartContainer config={ordersConfig} className="aspect-auto h-[220px] w-full">
                <BarChart data={weekdays} margin={{ left: 0, right: 8, top: 8 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(d: string) => d.slice(0, 3)} />
                  <YAxis tickLine={false} axisLine={false} width={28} allowDecimals={false} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, _name, item) => (
                          <div className="grid gap-0.5">
                            <span className="font-medium tabular-nums">{Number(value)} orders</span>
                            <span className="text-muted-foreground">Avg basket {formatGhs(Number(item?.payload?.avgBasket ?? 0))}</span>
                          </div>
                        )}
                      />
                    }
                  />
                  <Bar dataKey="orders" radius={[4, 4, 0, 0]}>
                    {weekdays.map((w) => (
                      <Cell key={w.day} fill="var(--color-orders)" fillOpacity={w.day === busiestDay?.day ? 1 : 0.45} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Busiest times</CardTitle>
            <CardDescription>
              {peak && peak.orders > 0 ? (
                <>
                  Most orders come between <span className="font-medium text-foreground">{hourLabel(peak.start)}</span> and {hourLabel((peak.start + 3) % 24)} (Ghana time).
                </>
              ) : (
                'Orders customers placed, by hour (Ghana time)'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[220px] w-full" />
            ) : !hasOrders ? (
              <Empty />
            ) : (
              <ChartContainer config={ordersConfig} className="aspect-auto h-[220px] w-full">
                <BarChart data={data!.byHour} margin={{ left: 0, right: 8, top: 8 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="hour" tickLine={false} axisLine={false} tickMargin={8} interval={2} tickFormatter={(h: number) => String(h).padStart(2, '0')} />
                  <YAxis tickLine={false} axisLine={false} width={28} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent labelFormatter={(_, p) => `${hourLabel(Number(p?.[0]?.payload?.hour ?? 0))}–${hourLabel((Number(p?.[0]?.payload?.hour ?? 0) + 1) % 24)}`} />} />
                  <Bar dataKey="orders" radius={[3, 3, 0, 0]}>
                    {data!.byHour.map((h) => {
                      const inPeak = peak ? [0, 1, 2].some((k) => (peak.start + k) % 24 === h.hour) : false;
                      return <Cell key={h.hour} fill="var(--color-orders)" fillOpacity={inPeak ? 1 : 0.45} />;
                    })}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>When orders come in</CardTitle>
          <CardDescription>Day × hour. Darker means more orders. Useful for planning picker and rider shifts.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <Skeleton className="h-[220px] w-full" />
          ) : !hasOrders ? (
            <Empty />
          ) : (
            <div className="min-w-[640px]">
              <div className="grid grid-cols-[48px_repeat(24,minmax(0,1fr))] gap-[3px]">
                <span />
                {Array.from({ length: 24 }, (_, h) => (
                  <span key={h} className="text-center text-[10px] text-muted-foreground tabular-nums">
                    {h % 3 === 0 ? String(h).padStart(2, '0') : ''}
                  </span>
                ))}
                {heatRows.map((row) => (
                  <div key={row.day} className="contents">
                    <span className="pr-2 text-right text-xs leading-6 text-muted-foreground">{row.day.slice(0, 3)}</span>
                    {row.cells.map((v, h) => (
                      <div
                        key={h}
                        className="h-6 rounded-[3px] bg-muted"
                        title={`${row.day} ${hourLabel(h)}: ${v} order${v === 1 ? '' : 's'}`}
                        style={v ? { background: `color-mix(in oklch, var(--chart-1) ${Math.round(15 + (v / maxCell) * 85)}%, transparent)` } : undefined}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Basket sizes</CardTitle>
            <CardDescription>
              {topBucket && t?.orders ? (
                <>
                  Most baskets are <span className="font-medium text-foreground">{topBucket.label.toLowerCase()}</span> ({pct(topBucket.orders, t.orders)}%). Goods only, before fees.
                </>
              ) : (
                'Goods only, before fees'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : !t?.orders ? (
              <Empty />
            ) : (
              <ul className="grid gap-2">
                {data!.basketBuckets.map((b) => (
                  <li key={b.label} className="relative overflow-hidden rounded-md">
                    <div className="absolute inset-y-0 left-0 rounded-md bg-primary/10" style={{ width: `${(b.orders / maxBucket) * 100}%` }} />
                    <div className="relative flex justify-between px-3 py-1.5 text-sm">
                      <span>{b.label}</span>
                      <span className="tabular-nums">
                        {b.orders} <span className="text-xs text-muted-foreground">({pct(b.orders, t.orders)}%)</span>
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top sellers</CardTitle>
            <CardDescription>By revenue in this range.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : !data?.topProducts.length ? (
              <Empty />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">Item</th>
                    <th className="pb-2 text-right font-medium">Orders</th>
                    <th className="pb-2 text-right font-medium">Units</th>
                    <th className="pb-2 text-right font-medium">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.topProducts.map((p) => (
                    <tr key={p.name}>
                      <td className="py-1.5 pr-2">{p.name}</td>
                      <td className="py-1.5 text-right tabular-nums">{p.orders}</td>
                      <td className="py-1.5 text-right tabular-nums">{p.quantity}</td>
                      <td className="py-1.5 text-right font-medium tabular-nums">{formatGhs(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How customers pay</CardTitle>
          <CardDescription>Share of orders, with what each brought in.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-16 w-full" />
          ) : !data?.paymentMethods.length ? (
            <Empty text="No payments in this range." />
          ) : (
            <div className="grid gap-4">
              <div className="flex h-3 overflow-hidden rounded-full bg-muted">
                {data.paymentMethods.map((m, i) => (
                  <div key={m.method} style={{ width: `${pct(m.orders, t?.orders ?? 0)}%`, background: `var(--chart-${(i % 5) + 1})` }} />
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {data.paymentMethods.map((m, i) => (
                  <div key={m.method} className="flex items-start gap-2 text-sm">
                    <span className="mt-1.5 size-2.5 shrink-0 rounded-full" style={{ background: `var(--chart-${(i % 5) + 1})` }} />
                    <div>
                      <p className="font-medium">{METHOD_LABEL[m.method] ?? m.method}</p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {pct(m.orders, t?.orders ?? 0)}% · {m.orders} orders · {formatGhs(m.revenue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {t && t.subscriptionOrders > 0 && (
        <p className="text-xs text-muted-foreground">
          Busiest days and times leave out {t.subscriptionOrders} subscription order{t.subscriptionOrders === 1 ? '' : 's'}, which are created automatically on schedule.
        </p>
      )}
    </div>
  );
}
