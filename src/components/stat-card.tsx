import { Link } from 'react-router-dom';
import { ArrowUpRight, TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  /** Icon tile colors, e.g. 'bg-sky-500/10 text-sky-600'. */
  tint: string;
  loading?: boolean;
  failed?: boolean;
  /** Makes the whole card a link (only pass routes the viewer can open). */
  href?: string;
  /** Percent change vs a comparison period, e.g. yesterday. Null/undefined hides it. */
  change?: number | null;
}

function ChangeBadge({ change }: { change: number }) {
  const up = change >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium tabular-nums',
        up ? 'bg-emerald-500/10 text-emerald-700' : 'bg-red-500/10 text-red-700',
      )}
    >
      <Icon className="size-3" />
      {up ? '+' : ''}
      {Math.round(change)}%
    </span>
  );
}

export function StatCard({ label, value, hint, icon: Icon, tint, loading, failed, href, change }: StatCardProps) {
  const body = (
    <Card className={cn('h-full gap-0 py-0 transition-all', href && 'group-hover:border-foreground/20 group-hover:shadow-md')}>
      <CardContent className="flex items-start justify-between gap-3 p-4 sm:p-5">
        <div className="min-w-0 space-y-1">
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            {label}
            {href && <ArrowUpRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />}
          </p>
          {loading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <p className={cn('truncate text-2xl font-semibold tracking-tight tabular-nums', failed && 'text-muted-foreground')}>
              {failed ? 'Unavailable' : value}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            {!failed && !loading && change != null && Number.isFinite(change) && <ChangeBadge change={change} />}
            <span>{failed ? 'Couldn’t load' : hint}</span>
          </div>
        </div>
        <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', tint)}>
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );

  return href ? (
    <Link to={href} className="group block rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
      {body}
    </Link>
  ) : (
    body
  );
}
