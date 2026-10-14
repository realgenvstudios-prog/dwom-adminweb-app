import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bike, ChevronRight, CircleCheck, Headset, PackageX, UserPlus, UserX, type LucideIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import adminApiClient from '../../services/apiClient';
import adminsService from '../../services/adminsService';
import supportService from '../../services/supportService';
import { canAccessRoute, type UiRole } from '../../config/permissions';
import { logger } from '../../utils/logger';

interface Row {
  label: string;
  count: number;
  path: string;
  icon: LucideIcon;
  tint: string;
}

interface NeedsAttentionCardProps {
  role: UiRole;
  outOfStockProducts: number | null;
  ordersWithoutRider: number | null;
  refreshKey: number;
}

// Things sitting in a queue waiting on someone, pulled from across pages so
// nobody has to visit four of them to find out. Rows for pages the viewer's
// role can't open are left out (and their endpoints aren't called).
export default function NeedsAttentionCard({ role, outOfStockProducts, ordersWithoutRider, refreshKey }: NeedsAttentionCardProps) {
  const [counts, setCounts] = useState<{ support: number; deletions: number; invites: number } | null>(null);
  const canSupport = canAccessRoute(role, '/support');
  const canDeletions = canAccessRoute(role, '/data-deletion-requests');
  const canAdmins = canAccessRoute(role, '/admins');

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      canDeletions ? adminApiClient.get<{ status: string }[]>('/account/deletion-requests') : Promise.resolve([]),
      canSupport ? supportService.getSupportMetrics() : Promise.resolve(null),
      canAdmins ? adminsService.getAdminMetrics() : Promise.resolve(null),
    ]).then(([del, sup, adm]) => {
      if (cancelled) return;
      if (del.status === 'rejected') logger.error('❌ [NeedsAttention] deletion requests:', del.reason);
      if (sup.status === 'rejected') logger.error('❌ [NeedsAttention] support metrics:', sup.reason);
      if (adm.status === 'rejected') logger.error('❌ [NeedsAttention] admin metrics:', adm.reason);
      setCounts({
        deletions: del.status === 'fulfilled' && Array.isArray(del.value) ? del.value.filter((r) => r.status === 'PENDING').length : 0,
        support: sup.status === 'fulfilled' && sup.value ? (sup.value.needsReply ?? 0) : 0,
        invites: adm.status === 'fulfilled' && adm.value ? adm.value.pendingAdmins : 0,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [refreshKey, canDeletions, canSupport, canAdmins]);

  const rows: Row[] = [
    { label: 'Orders without a rider', count: ordersWithoutRider ?? 0, path: '/orders', icon: Bike, tint: 'bg-violet-500/10 text-violet-600' },
    { label: 'Customers waiting for a reply', count: counts?.support ?? 0, path: '/support?view=needs_reply', icon: Headset, tint: 'bg-sky-500/10 text-sky-600' },
    { label: 'Products out of stock', count: outOfStockProducts ?? 0, path: '/catalog', icon: PackageX, tint: 'bg-red-500/10 text-red-600' },
    { label: 'Data deletion requests', count: counts?.deletions ?? 0, path: '/data-deletion-requests', icon: UserX, tint: 'bg-amber-500/10 text-amber-600' },
    { label: 'Pending admin invites', count: counts?.invites ?? 0, path: '/admins', icon: UserPlus, tint: 'bg-muted text-muted-foreground' },
  ].filter((r) => r.count > 0 && canAccessRoute(role, r.path));

  const loading = counts === null || outOfStockProducts === null || ordersWithoutRider === null;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Needs attention</CardTitle>
        <CardDescription>Waiting on someone right now</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <CircleCheck className="size-8 text-emerald-500" />
            <p className="text-sm font-medium">All clear</p>
            <p className="text-xs text-muted-foreground">Nothing is waiting on anyone.</p>
          </div>
        ) : (
          <ul className="-mx-2 space-y-1">
            {rows.map((r) => (
              <li key={r.path}>
                <Link to={r.path} className="group flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted/60">
                  <span className={`flex size-8 shrink-0 items-center justify-center rounded-md ${r.tint}`}>
                    <r.icon className="size-4" />
                  </span>
                  <span className="flex-1 text-sm">{r.label}</span>
                  <span className="text-sm font-semibold tabular-nums">{r.count}</span>
                  <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
