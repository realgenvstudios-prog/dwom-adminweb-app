import { Area, Bar, CartesianGrid, ComposedChart, XAxis, YAxis } from 'recharts';
import { CreditCard, MousePointerClick, Search, ShoppingBag, SearchX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/stat-card';
import type { AnalyticsInsights } from '../../services/analyticsService';

const chartConfig: ChartConfig = {
  sessions: { label: 'App sessions', color: 'var(--chart-2)' },
  orders: { label: 'Orders', color: 'var(--chart-1)' },
};

const dayLabel = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 1000) / 10 : 0);

// Screen route names → what an admin would call them.
const SCREEN_NAMES: Record<string, string> = {
  Home: 'Home',
  Search: 'Search',
  Categories: 'Categories',
  Bundles: 'Bundles',
  Discounts: 'Discounts',
  Seasonal: 'Seasonal',
  Cart: 'Cart',
  Checkout: 'Checkout',
  OrderSuccess: 'Order placed',
  Notes: 'Shopping notes',
  NoteReview: 'Note review',
  Orders: 'My orders',
  TrackOrder: 'Order tracking',
  OrderHistoryDetails: 'Past order',
  SubscriptionPlans: 'Subscriptions',
  SubscriptionDetails: 'Subscription details',
  ChatSupport: 'Support chat',
  GetHelp: 'Help',
  Notifications: 'Notifications',
  Profile: 'Profile',
  Addresses: 'Addresses',
};

function BarList({ rows, max }: { rows: { label: string; value: number; hint?: string }[]; max: number }) {
  return (
    <ul className="grid gap-2">
      {rows.map((r) => (
        <li key={r.label} className="relative overflow-hidden rounded-md">
          <div className="absolute inset-y-0 left-0 rounded-md bg-primary/10" style={{ width: `${max > 0 ? Math.max(2, (r.value / max) * 100) : 0}%` }} />
          <div className="relative flex items-center justify-between gap-3 px-3 py-1.5 text-sm">
            <span className="truncate">{r.label}</span>
            <span className="shrink-0 tabular-nums">
              {r.value.toLocaleString()}
              {r.hint && <span className="ml-1.5 text-xs text-muted-foreground">{r.hint}</span>}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Unavailable() {
  return <p className="py-8 text-center text-sm text-muted-foreground">Couldn’t load this. Refresh to try again.</p>;
}

export default function OverviewTab({ data, loading, failed }: { data: AnalyticsInsights | null; loading: boolean; failed: boolean }) {
  const t = data?.totals;
  const funnelTop = data?.funnel[0]?.sessions ?? 0;
  const missedTotal = (data?.topSearches ?? []).reduce((s, q) => s + q.zeroResults, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="App sessions"
          value={(t?.sessions ?? 0).toLocaleString()}
          hint={t ? `${t.activeCustomers.toLocaleString()} signed-in customers · ${t.guestSessions.toLocaleString()} guest sessions` : undefined}
          icon={MousePointerClick}
          tint="bg-sky-500/10 text-sky-600"
          loading={loading}
          failed={failed}
        />
        <StatCard
          label="Orders from the app"
          value={(t?.orders ?? 0).toLocaleString()}
          hint={t ? `${pct(t.orders, t.sessions)}% of sessions end in an order` : undefined}
          icon={ShoppingBag}
          tint="bg-emerald-500/10 text-emerald-600"
          loading={loading}
          failed={failed}
        />
        <StatCard
          label="Searches"
          value={(t?.searches ?? 0).toLocaleString()}
          hint={t ? `${pct(missedTotal, t.searches)}% found nothing` : undefined}
          icon={Search}
          tint="bg-violet-500/10 text-violet-600"
          loading={loading}
          failed={failed}
        />
        <StatCard
          label="Card & MoMo payments"
          value={(t?.paymentsSucceeded ?? 0).toLocaleString()}
          hint={t ? `${t.paymentsFailed.toLocaleString()} failed · cash orders not included` : undefined}
          icon={CreditCard}
          tint="bg-amber-500/10 text-amber-600"
          loading={loading}
          failed={failed}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Where people drop off</CardTitle>
            <CardDescription>App sessions reaching each step</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[260px] w-full" />
            ) : !data ? (
              <Unavailable />
            ) : (
              <ol className="grid gap-3">
                {data.funnel.map((f, i) => {
                  const prev = data.funnel[i - 1];
                  const width = funnelTop > 0 ? (f.sessions / funnelTop) * 100 : 0;
                  return (
                    <li key={f.step} className="grid gap-1">
                      <div className="flex items-baseline justify-between gap-2 text-sm">
                        <span className="font-medium">{f.label}</span>
                        <span className="tabular-nums">
                          {f.sessions.toLocaleString()}
                          {prev && prev.sessions > 0 && <span className="ml-1.5 text-xs text-muted-foreground">{pct(f.sessions, prev.sessions)}% of previous</span>}
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.max(width, f.sessions > 0 ? 1.5 : 0)}%`, opacity: 1 - i * 0.12 }} />
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Daily activity</CardTitle>
            <CardDescription>App sessions and the orders they turned into</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[260px] w-full" />
            ) : !data ? (
              <Unavailable />
            ) : (
              <ChartContainer config={chartConfig} className="aspect-auto h-[260px] w-full">
                <ComposedChart data={data.daily} margin={{ left: 0, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="fill-sessions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-sessions)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-sessions)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} tickFormatter={dayLabel} />
                  <YAxis yAxisId="s" tickLine={false} axisLine={false} width={40} />
                  <YAxis yAxisId="o" orientation="right" tickLine={false} axisLine={false} width={32} />
                  <ChartTooltip content={<ChartTooltipContent labelFormatter={(_, p) => dayLabel(String(p?.[0]?.payload?.date ?? ''))} />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Area yAxisId="s" dataKey="sessions" type="monotone" stroke="var(--color-sessions)" fill="url(#fill-sessions)" strokeWidth={2} />
                  <Bar yAxisId="o" dataKey="orders" fill="var(--color-orders)" radius={[3, 3, 0, 0]} maxBarSize={14} />
                </ComposedChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>What people search for</CardTitle>
            <CardDescription>Most frequent searches in the app</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : !data ? (
              <Unavailable />
            ) : data.topSearches.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No searches in this range.</p>
            ) : (
              <BarList
                rows={data.topSearches.map((s) => ({ label: s.query, value: s.count, hint: s.zeroResults > 0 ? `${s.zeroResults} empty` : undefined }))}
                max={data.topSearches[0]?.count ?? 0}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SearchX className="size-4 text-red-600" />
              Searched for, but not found
            </CardTitle>
            <CardDescription>Searches that returned nothing: products customers want that the catalog doesn’t match</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : !data ? (
              <Unavailable />
            ) : data.missedSearches.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Every search found something. 🎉</p>
            ) : (
              <ul className="divide-y rounded-lg border text-sm">
                {data.missedSearches.map((s) => (
                  <li key={s.query} className="flex items-center justify-between gap-3 px-3 py-2">
                    <span className="truncate font-medium">{s.query}</span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="text-muted-foreground tabular-nums">
                        {s.zeroResults.toLocaleString()} of {s.count.toLocaleString()} searches
                      </span>
                      {s.zeroResults === s.count && (
                        <Badge variant="outline" className="border-red-500/20 bg-red-500/10 text-red-700">
                          Never found
                        </Badge>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Most visited screens</CardTitle>
            <CardDescription>Screen views in this range</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-56 w-full" />
            ) : !data ? (
              <Unavailable />
            ) : data.topScreens.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No screen views in this range.</p>
            ) : (
              <BarList rows={data.topScreens.map((s) => ({ label: SCREEN_NAMES[s.screen] ?? s.screen, value: s.views }))} max={data.topScreens[0]?.views ?? 0} />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Devices</CardTitle>
            <CardDescription>Share of app sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-32 w-full" />
            ) : !data ? (
              <Unavailable />
            ) : data.platforms.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No sessions in this range.</p>
            ) : (
              <div className="grid gap-4">
                <div className="flex h-3 overflow-hidden rounded-full bg-muted">
                  {data.platforms.map((p, i) => (
                    <div key={p.platform} className="h-full" style={{ width: `${pct(p.sessions, t?.sessions || 1)}%`, background: `var(--chart-${(i % 5) + 1})` }} />
                  ))}
                </div>
                <ul className="grid gap-1.5 text-sm">
                  {data.platforms.map((p, i) => (
                    <li key={p.platform} className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span className="size-2.5 rounded-full" style={{ background: `var(--chart-${(i % 5) + 1})` }} />
                        {p.platform === 'ios' ? 'iPhone' : p.platform === 'android' ? 'Android' : p.platform}
                      </span>
                      <span className="tabular-nums">{pct(p.sessions, t?.sessions || 1)}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
