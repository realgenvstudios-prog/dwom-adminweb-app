import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { RiderData } from '../../services/ridersService';
import { isOnline } from './useDashboard';

// Rider.status is set by the rider app: offline / available / busy / on_delivery.
const STATUS: Record<string, { label: string; dot: string; rank: number }> = {
  on_delivery: { label: 'On delivery', dot: 'bg-violet-500', rank: 0 },
  busy: { label: 'Busy', dot: 'bg-amber-500', rank: 1 },
  available: { label: 'Available', dot: 'bg-emerald-500', rank: 2 },
  offline: { label: 'Offline', dot: 'bg-muted-foreground/40', rank: 3 },
};

interface RidersCardProps {
  riders: RiderData[] | null;
  loading: boolean;
  linkable: boolean;
}

export default function RidersCard({ riders, loading, linkable }: RidersCardProps) {
  const active = (riders ?? []).filter((r) => r.isActive);
  const sorted = [...active].sort(
    (a, b) => (STATUS[a.status]?.rank ?? 9) - (STATUS[b.status]?.rank ?? 9) || a.name.localeCompare(b.name),
  );
  const online = active.filter(isOnline).length;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Riders</CardTitle>
        <CardDescription>
          {loading ? 'Loading…' : riders === null ? 'Couldn’t load riders' : `${online} online of ${active.length} active`}
        </CardDescription>
        {linkable && (
          <CardAction>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/field-operations">
                Manage
                <ArrowRight />
              </Link>
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">{riders === null ? 'Try refreshing in a moment.' : 'No active riders.'}</p>
        ) : (
          <ul className="space-y-3">
            {sorted.slice(0, 7).map((r) => {
              const s = STATUS[r.status] ?? { label: r.status, dot: 'bg-muted-foreground/40', rank: 9 };
              return (
                <li key={r.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{r.name}</p>
                    {r.zone && <p className="truncate text-xs text-muted-foreground">{r.zone}</p>}
                  </div>
                  <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                    <span className={cn('size-2 rounded-full', s.dot)} />
                    {s.label}
                  </span>
                </li>
              );
            })}
            {sorted.length > 7 && <li className="text-xs text-muted-foreground">+{sorted.length - 7} more</li>}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
