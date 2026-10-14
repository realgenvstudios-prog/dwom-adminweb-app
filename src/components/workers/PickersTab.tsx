import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CalendarDays, Info, Plus, RotateCw, ShoppingBasket, Users, Wallet } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/data-table';
import { StatCard } from '@/components/stat-card';
import adminAuthService from '../../services/authService';
import settingsService from '../../services/settingsService';
import workersService, { type Trip, type Worker } from '../../services/workersService';
import { canAccessRoute, resolveUiRole } from '../../config/permissions';
import { logger } from '../../utils/logger';
import { formatGhs } from '../orders/order-status';
import CreatePickerDialog from './CreatePickerDialog';
import { buildRosterColumns, buildTripColumns } from './columns';
import { PICKER_TYPES, buildPickerRows, dayKey, tripPay, type PickerRow } from './picker-meta';

interface PayRule {
  rate: number;
  minimum: number;
  threshold: number;
}

export default function PickersTab() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [rule, setRule] = useState<PayRule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [toggleFor, setToggleFor] = useState<PickerRow | null>(null);
  const [removeTrip, setRemoveTrip] = useState<Trip | null>(null);
  const canOpenOrders = canAccessRoute(resolveUiRole(adminAuthService.getCurrentAdmin()), '/orders');

  const load = useCallback(async () => {
    try {
      setError(null);
      // includeInactive: otherwise a deactivated picker vanishes and can never be reactivated.
      const [w, t] = await Promise.all([workersService.getAll(true), workersService.getTrips()]);
      setWorkers(w ?? []);
      setTrips(t ?? []);
    } catch (err) {
      logger.error('Failed to load pickers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load pickers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      void load();
      settingsService
        .getSettings()
        .then((s) => {
          const r = { rate: Number(s.pickerRatePerOrder), minimum: Number(s.pickerDailyMinimumPay), threshold: Number(s.pickerDailyThreshold) };
          // Older backends don't return these fields; show nothing rather than "NaN".
          if ([r.rate, r.minimum, r.threshold].every(Number.isFinite)) setRule(r);
        })
        .catch((err) => logger.error('Failed to load picker pay settings:', err));
    }, 0);
    return () => clearTimeout(t);
  }, [load]);

  const [today] = useState(() => dayKey(new Date()));
  const [weekStart] = useState(() => dayKey(new Date(Date.now() - 6 * 86_400_000)));
  const rows = useMemo(() => buildPickerRows(workers, trips, weekStart), [workers, trips, weekStart]);
  const todayTrips = trips.filter((t) => dayKey(t.date) === today);
  const weekTrips = trips.filter((t) => dayKey(t.date) >= weekStart);

  const rosterColumns = useMemo(() => buildRosterColumns((w) => setToggleFor(w)), []);
  const tripColumns = useMemo(() => buildTripColumns((t) => setRemoveTrip(t), canOpenOrders), [canOpenOrders]);

  const confirmToggle = async () => {
    const w = toggleFor;
    if (!w) return;
    try {
      await workersService.update(w.id, { active: !w.active });
      toast.success(w.active ? `${w.name} deactivated` : `${w.name} reactivated`);
      await load();
    } catch (err) {
      logger.error('Failed to update picker:', err);
      toast.error(`Couldn't update ${w.name}.`);
    } finally {
      setToggleFor(null);
    }
  };

  const confirmRemoveTrip = async () => {
    const t = removeTrip;
    if (!t) return;
    try {
      await workersService.deleteTrip(t.id);
      toast.success('Trip removed and that day’s pay recalculated');
      await load();
    } catch (err) {
      logger.error('Failed to delete trip:', err);
      toast.error('Couldn’t remove the trip.');
    } finally {
      setRemoveTrip(null);
    }
  };

  const errorBanner = error && (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
      <div className="flex items-center gap-2 text-destructive">
        <AlertCircle className="size-4" />
        Couldn’t load pickers: {error}
      </div>
      <Button variant="outline" size="sm" onClick={() => void load()}>
        <RotateCw />
        Retry
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active pickers" value={String(workers.filter((w) => w.active).length)} hint={`${workers.length} on the roster`} icon={Users} tint="bg-sky-500/10 text-sky-600" loading={loading} failed={!!error} />
        <StatCard label="Orders picked today" value={String(todayTrips.reduce((s, t) => s + t.TripOrder.length, 0))} hint={`${new Set(todayTrips.map((t) => t.workerId)).size} pickers working`} icon={ShoppingBasket} tint="bg-emerald-500/10 text-emerald-600" loading={loading} failed={!!error} />
        <StatCard label="Picker pay today" value={formatGhs(todayTrips.reduce((s, t) => s + tripPay(t), 0))} hint="For today’s trips" icon={Wallet} tint="bg-amber-500/10 text-amber-600" loading={loading} failed={!!error} />
        <StatCard label="Pay, last 7 days" value={formatGhs(weekTrips.reduce((s, t) => s + tripPay(t), 0))} hint={`${weekTrips.reduce((s, t) => s + t.TripOrder.length, 0)} orders`} icon={CalendarDays} tint="bg-violet-500/10 text-violet-600" loading={loading} failed={!!error} />
      </div>

      {rule && (
        <p className="flex items-start gap-2 rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" />
          <span>
            Pay is worked out per picker, per day: <strong className="text-foreground">{rule.threshold}+ orders</strong> earns{' '}
            <strong className="text-foreground">{formatGhs(rule.rate)} per order</strong>; fewer earns a{' '}
            <strong className="text-foreground">{formatGhs(rule.minimum)}</strong> minimum for the day, split across those orders. Change it in Finance › Settings.
          </span>
        </p>
      )}

      {errorBanner}

      <Tabs defaultValue="roster" className="gap-4">
        <TabsList>
          <TabsTrigger value="roster">
            Roster
            <span className="ml-1 text-xs text-muted-foreground tabular-nums">{workers.length}</span>
          </TabsTrigger>
          <TabsTrigger value="trips">
            Trips
            <span className="ml-1 text-xs text-muted-foreground tabular-nums">{trips.length}</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="roster">
          <DataTable
            columns={rosterColumns}
            data={rows}
            isLoading={loading}
            getRowId={(w) => String(w.id)}
            initialSorting={[{ id: 'picker', desc: false }]}
            searchPlaceholder="Search pickers…"
            filters={[
              { columnId: 'type', title: 'Type', options: PICKER_TYPES },
              {
                columnId: 'status',
                title: 'Status',
                options: [
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                ],
              },
            ]}
            emptyMessage={workers.length === 0 ? 'No pickers yet. Add your first one.' : 'No pickers match these filters.'}
            toolbarActions={
              <Button size="sm" className="h-8" onClick={() => setCreateOpen(true)}>
                <Plus />
                Add picker
              </Button>
            }
          />
        </TabsContent>
        <TabsContent value="trips">
          <DataTable
            columns={tripColumns}
            data={trips}
            isLoading={loading}
            getRowId={(t) => String(t.id)}
            initialSorting={[{ id: 'date', desc: true }]}
            searchPlaceholder="Search order #…"
            filters={[{ columnId: 'picker', title: 'Picker', options: workers.map((w) => ({ value: String(w.id), label: w.name })) }]}
            emptyMessage={trips.length === 0 ? 'No trips yet. They’re created when you assign a picker to an order.' : 'No trips match these filters.'}
          />
        </TabsContent>
      </Tabs>

      <CreatePickerDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={() => void load()} />

      <AlertDialog open={!!toggleFor} onOpenChange={(o) => !o && setToggleFor(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{toggleFor?.active ? `Deactivate ${toggleFor?.name}?` : `Reactivate ${toggleFor?.name}?`}</AlertDialogTitle>
            <AlertDialogDescription>
              {toggleFor?.active
                ? 'They won’t appear when assigning pickers to orders. Past trips and pay are kept.'
                : 'They’ll be available to assign to orders again.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant={toggleFor?.active ? 'destructive' : 'default'} onClick={() => void confirmToggle()}>
              {toggleFor?.active ? 'Deactivate' : 'Reactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!removeTrip} onOpenChange={(o) => !o && setRemoveTrip(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this trip?</AlertDialogTitle>
            <AlertDialogDescription>
              This unassigns {removeTrip?.Worker?.name ?? 'the picker'} from{' '}
              {removeTrip?.TripOrder.length === 1 ? `order #${removeTrip.TripOrder[0].orderId}` : `all ${removeTrip?.TripOrder.length} orders on it (${removeTrip?.TripOrder.map((o) => `#${o.orderId}`).join(', ')})`}
              , and recalculates their pay for that day.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep trip</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => void confirmRemoveTrip()}>
              Remove trip
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
