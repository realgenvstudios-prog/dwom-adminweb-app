import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Bike, Map, MapPin, MoreHorizontal, Pause, Pencil, Play, Plus, RotateCw, Trash2, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/stat-card';
import { cn } from '@/lib/utils';
import deliveryService, { type DeliveryZone } from '../../services/deliveryService';
import { logger } from '../../utils/logger';
import DeliveryCheckCard from '../delivery/DeliveryCheckCard';
import ZoneDialog from '../delivery/ZoneDialog';
import { formatGhs } from '../orders/order-status';
import { num } from '../riders/rider-meta';
import { formatArea, zoneAreaKm2 } from '../delivery/zone-shape';
import { can } from '../../config/permissions';

// Zone coverage is a rider-logistics concern, so zones live on Field
// Operations next to Riders and Pickers.
export default function ZonesTab() {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editor, setEditor] = useState<{ zone: DeliveryZone | null; token: number } | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [toDelete, setToDelete] = useState<DeliveryZone | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setZones((await deliveryService.getAllZones()) ?? []);
    } catch (err) {
      logger.error('Failed to load zones:', err);
      setError(err instanceof Error ? err.message : 'Failed to load delivery zones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  const openEditor = (zone: DeliveryZone | null) => {
    setEditor({ zone, token: Date.now() });
    setEditorOpen(true);
  };

  const toggle = async (z: DeliveryZone) => {
    try {
      await deliveryService.toggleZone(z.id);
      toast.success(z.isActive ? `${z.name} paused. No new deliveries there` : `${z.name} is delivering again`);
      await load();
    } catch (err) {
      logger.error('Failed to toggle zone:', err);
      toast.error(`Couldn't update ${z.name}.`);
    }
  };

  const confirmDelete = async () => {
    const z = toDelete;
    if (!z) return;
    try {
      await deliveryService.deleteZone(z.id);
      toast.success(`${z.name} deleted`);
      await load();
    } catch (err) {
      logger.error('Failed to delete zone:', err);
      toast.error(`Couldn't delete ${z.name}.`);
    } finally {
      setToDelete(null);
    }
  };

  const active = zones.filter((z) => z.isActive);
  const fees = active.map((z) => num(z.deliveryFee));
  const riders = zones.reduce((s, z) => s + (z.Rider?.length ?? 0), 0);
  const sorted = [...active, ...zones.filter((z) => !z.isActive)];
  const feeRange = !fees.length ? 'None' : Math.min(...fees) === Math.max(...fees) ? formatGhs(fees[0]) : `${formatGhs(Math.min(...fees))} – ${Math.max(...fees).toFixed(2)}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Delivering"
          value={String(active.length)}
          hint={`${zones.length - active.length} paused`}
          icon={Map}
          tint="bg-emerald-500/10 text-emerald-600"
          loading={loading}
          failed={!!error}
        />
        <StatCard label="Delivery fees" value={feeRange} hint="Across active zones" icon={Wallet} tint="bg-amber-500/10 text-amber-600" loading={loading} failed={!!error} />
        <StatCard
          label="Riders covering"
          value={String(riders)}
          hint="Active riders assigned to a zone"
          icon={Bike}
          tint="bg-sky-500/10 text-sky-600"
          loading={loading}
          failed={!!error}
        />
        <StatCard
          label="Coverage"
          value={active.length ? formatArea(active.reduce((sum, z) => sum + zoneAreaKm2(z), 0)) : 'None'}
          hint="Active zones combined (overlaps count twice)"
          icon={MapPin}
          tint="bg-violet-500/10 text-violet-600"
          loading={loading}
          failed={!!error}
        />
      </div>

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="size-4" />
            Couldn’t load zones: {error}
          </div>
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RotateCw />
            Retry
          </Button>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">Customers can only order from inside an active zone. Where zones overlap, the cheapest fee applies.</p>
            {can('zones.manage') && (
              <Button size="sm" className="h-8 shrink-0" onClick={() => openEditor(null)}>
                <Plus />
                New zone
              </Button>
            )}
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-36 w-full rounded-xl" />
              ))}
            </div>
          ) : zones.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-10 text-center">
              <Map className="size-8 text-muted-foreground" />
              <div>
                <p className="font-medium">No delivery zones yet</p>
                <p className="text-sm text-muted-foreground">Until you add one, nobody can place an order.</p>
              </div>
              {can('zones.manage') && (
                <Button size="sm" onClick={() => openEditor(null)}>
                  <Plus />
                  Create the first zone
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {sorted.map((z) => (
                <Card key={z.id} className={cn('gap-0 py-0 transition-shadow hover:shadow-md', !z.isActive && 'bg-muted/40')}>
                  <div className="flex items-start gap-3 p-4 pb-3">
                    <div
                      className={cn(
                        'flex size-10 shrink-0 items-center justify-center rounded-lg',
                        z.isActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground',
                      )}
                    >
                      <MapPin className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium">{z.name}</p>
                        {!z.isActive && <Badge variant="secondary">Paused</Badge>}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{z.description || `${z.lat.toFixed(4)}, ${z.lng.toFixed(4)}`}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" className="-mr-1 data-[state=open]:bg-muted">
                          <MoreHorizontal />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {can('zones.manage') && (
                          <DropdownMenuItem onSelect={() => openEditor(z)}>
                            <Pencil />
                            Edit
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onSelect={() => void toggle(z)}>
                          {z.isActive ? <Pause /> : <Play />}
                          {z.isActive ? 'Pause deliveries' : 'Resume deliveries'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {can('zones.delete') && (
                          <DropdownMenuItem variant="destructive" disabled={!!z.Rider?.length} onSelect={() => setToDelete(z)}>
                            <Trash2 />
                            Delete
                          </DropdownMenuItem>
                        )}
                        {!!z.Rider?.length && (
                          // The API refuses this delete, but its reason arrives as a generic 500.
                          <p className="px-2 pb-1.5 text-xs text-muted-foreground">
                            Reassign its {z.Rider.length} rider{z.Rider.length === 1 ? '' : 's'} to another zone first.
                          </p>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <dl className="grid grid-cols-4 gap-2 border-t px-4 py-3 text-sm">
                    <div>
                      <dt className="text-xs text-muted-foreground">Fee</dt>
                      <dd className="font-semibold tabular-nums">{formatGhs(num(z.deliveryFee))}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Rider pay</dt>
                      <dd className="font-semibold tabular-nums">{z.riderPay != null ? formatGhs(num(z.riderPay)) : <span className="font-normal text-muted-foreground">Default</span>}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">{z.polygon && z.polygon.length >= 3 ? 'Area' : 'Area (circle)'}</dt>
                      <dd className="font-semibold tabular-nums">{formatArea(zoneAreaKm2(z))}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Riders</dt>
                      <dd className={cn('font-semibold tabular-nums', z.isActive && !z.Rider?.length && 'text-amber-600')}>{z.Rider?.length ?? 0}</dd>
                    </div>
                  </dl>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="xl:sticky xl:top-20 xl:self-start">
          <DeliveryCheckCard />
        </div>
      </div>

      {editor && <ZoneDialog key={editor.token} zone={editor.zone} open={editorOpen} onOpenChange={setEditorOpen} onSaved={() => void load()} />}

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {toDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Customers there can no longer order. Past orders delivered in this zone lose their zone link, so they drop out of Finance’s revenue-by-zone report. To stop deliveries
              but keep that history, pause the zone instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {toDelete?.isActive && (
              <Button
                variant="outline"
                onClick={() => {
                  const z = toDelete;
                  setToDelete(null);
                  void toggle(z);
                }}
              >
                Pause instead
              </Button>
            )}
            <AlertDialogAction variant="destructive" onClick={() => void confirmDelete()}>
              Delete zone
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
