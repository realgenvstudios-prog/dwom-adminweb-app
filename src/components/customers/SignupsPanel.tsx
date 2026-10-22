import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import { TrendingDown, TrendingUp, UserPlus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import PeriodBar from '../finance/overview/PeriodBar';
import { bucketFor, rangeOf, type Period } from '../finance/overview/period';
import type { Customer } from './CustomerTypes';
import { dayOf, joinedIn } from './signups';

const config: ChartConfig = { signups: { label: 'Sign-ups', color: 'var(--chart-1)' } };

function bucketKey(day: string, bucket: 'daily' | 'weekly' | 'monthly') {
  if (bucket === 'monthly') return day.slice(0, 7);
  if (bucket === 'daily') return day;
  const t = Date.parse(`${day}T00:00:00Z`);
  const monday = t - ((new Date(t).getUTCDay() + 6) % 7) * 86_400_000;
  return new Date(monday).toISOString().slice(0, 10);
}

function bucketLabel(key: string, bucket: 'daily' | 'weekly' | 'monthly') {
  if (bucket === 'monthly') return new Date(`${key}-01T00:00:00Z`).toLocaleDateString('en-GB', { month: 'short', year: '2-digit', timeZone: 'UTC' });
  const d = new Date(`${key}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  return bucket === 'weekly' ? `w/c ${d}` : d;
}

interface SignupsPanelProps {
  customers: Customer[];
  period: Period;
  onPeriodChange: (p: Period) => void;
  /** Filter the table below to these sign-ups. */
  onlyThese: boolean;
  onOnlyTheseChange: (v: boolean) => void;
  loading: boolean;
}

/** How many people joined in any day, week, month, year or custom range, with the change and a chart. */
export default function SignupsPanel({ customers, period, onPeriodChange, onlyThese, onOnlyTheseChange, loading }: SignupsPanelProps) {
  const range = rangeOf(period);
  // Cheap enough to work out on each render (a few thousand customers at most).
  const { count, previous, series, bucket } = (() => {
    const inRange = joinedIn(customers, range.start, range.end);
    const prev = range.compareStart && range.compareEnd ? joinedIn(customers, range.compareStart, range.compareEnd).length : null;
    const start = range.start ?? (customers.length ? customers.map((c) => dayOf(c.createdAt)).sort()[0] : range.end);
    const b = bucketFor({ ...range, start });
    // Every bucket in the range, including empty ones, so gaps show as gaps.
    const keys: string[] = [];
    for (let t = Date.parse(`${start}T00:00:00Z`); t <= Date.parse(`${range.end}T00:00:00Z`); t += 86_400_000) {
      const k = bucketKey(new Date(t).toISOString().slice(0, 10), b);
      if (keys[keys.length - 1] !== k) keys.push(k);
    }
    const counts = new Map(keys.map((k) => [k, 0]));
    for (const c of inRange) {
      const k = bucketKey(dayOf(c.createdAt), b);
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    return { count: inRange.length, previous: prev, series: keys.map((k) => ({ key: k, label: bucketLabel(k, b), signups: counts.get(k) ?? 0 })), bucket: b };
  })();

  const change = previous === null ? null : count - previous;
  const single = series.length <= 1;

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="size-4 text-muted-foreground" />
              New sign-ups
            </CardTitle>
            <CardDescription>{range.label}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="only-signups" checked={onlyThese} onCheckedChange={onOnlyTheseChange} />
            <Label htmlFor="only-signups" className="text-sm font-normal">
              Show only these in the table
            </Label>
          </div>
        </div>
        <PeriodBar value={period} onChange={onPeriodChange} />
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <div className="space-y-1">
          <p className="text-4xl font-semibold tracking-tight tabular-nums">{loading ? '…' : count.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">{count === 1 ? 'person joined' : 'people joined'}</p>
          {change !== null && !loading && (
            <p className={cn('flex items-center gap-1 pt-2 text-sm tabular-nums', change > 0 ? 'text-emerald-600' : change < 0 ? 'text-destructive' : 'text-muted-foreground')}>
              {change > 0 ? <TrendingUp className="size-4" /> : change < 0 ? <TrendingDown className="size-4" /> : null}
              {change > 0 ? '+' : ''}
              {change.toLocaleString()} {range.compareLabel}
              <span className="text-muted-foreground">({previous?.toLocaleString()})</span>
            </p>
          )}
        </div>
        {single ? (
          <p className="self-center text-sm text-muted-foreground">Pick a week, month or longer to see sign-ups over time.</p>
        ) : (
          <ChartContainer config={config} className="h-40 w-full">
            <BarChart data={series} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={16} fontSize={11} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent labelFormatter={(_, p) => (p?.[0]?.payload?.label as string) ?? ''} />} />
              <Bar dataKey="signups" fill="var(--color-signups)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )}
        {bucket !== 'daily' && !single && <span className="sr-only">Grouped by {bucket === 'weekly' ? 'week' : 'month'}</span>}
      </CardContent>
    </Card>
  );
}
