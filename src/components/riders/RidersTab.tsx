import { useMemo, useState } from 'react';
import { AlertCircle, Bike, CircleDot, MapPinOff, Navigation, Plus, Radar, RotateCw } from 'lucide-react';
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
import { DataTable } from '@/components/data-table';
import { StatCard } from '@/components/stat-card';
import ridersService from '../../services/ridersService';
import { logger } from '../../utils/logger';
import AssignZoneDialog from './AssignZoneDialog';
import CreateRiderDialog from './CreateRiderDialog';
import DispatchSettingsDialog from './DispatchSettingsDialog';
import RiderSheet from './RiderSheet';
import { buildRiderColumns } from './columns';
import { NO_ZONE, RIDER_STATUSES, riderStatusMeta } from './rider-meta';
import { useRidersData, type Rider } from './useRidersData';
import { can } from '../../config/permissions';

export default function RidersTab() {
  const { riders, zones, loading, error, refresh, patchRider } = useRidersData();
  const [viewId, setViewId] = useState<number | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [zoneFor, setZoneFor] = useState<{ id: number; token: number } | null>(null);
  const [zoneOpen, setZoneOpen] = useState(false);
  const [toggleFor, setToggleFor] = useState<Rider | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [dispatchOpen, setDispatchOpen] = useState(false);

  const viewing = riders.find((r) => r.id === viewId) ?? null;
  const zoneRider = zoneFor ? (riders.find((r) => r.id === zoneFor.id) ?? null) : null;

  const columns = useMemo(
    () =>
      buildRiderColumns({
        onView: (r) => {
          setViewId(r.id);
          setViewOpen(true);
        },
        onAssignZone: (r) => {
          setZoneFor({ id: r.id, token: Date.now() });
          setZoneOpen(true);
        },
        onToggleActive: (r) => setToggleFor(r),
        onStatus: async (r, status) => {
          const prev = r.status;
          patchRider(r.id, { status: status as Rider['status'] });
          try {
            await ridersService.updateRiderStatus(r.id, status);
            toast.success(`${r.name} is now ${riderStatusMeta(status).label.toLowerCase()}`);
          } catch (err) {
            patchRider(r.id, { status: prev });
            logger.error('Failed to update rider status:', err);
            toast.error(`Couldn't update ${r.name}'s status.`);
          }
        },
      }),
    [patchRider],
  );

  const confirmToggle = async () => {
    const r = toggleFor;
    if (!r) return;
    try {
      if (r.isActive) await ridersService.deactivateRider(r.id);
      else await ridersService.reactivateRider(r.id);
      toast.success(r.isActive ? `${r.name} deactivated` : `${r.name} reactivated`);
      await refresh();
    } catch (err) {
      logger.error('Failed to change rider activation:', err);
      toast.error(`Couldn't ${r.isActive ? 'deactivate' : 'reactivate'} ${r.name}.`);
    } finally {
      setToggleFor(null);
    }
  };

  const active = riders.filter((r) => r.isActive);
  const unzoned = active.filter((r) => r.zoneId == null).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Active riders"
          value={String(active.length)}
          hint={`${riders.length - active.length} deactivated`}
          icon={Bike}
          tint="bg-sky-500/10 text-sky-600"
          loading={loading}
          failed={!!error}
        />
        <StatCard
          label="Available now"
          value={String(active.filter((r) => r.status === 'available').length)}
          hint="Ready for a delivery"
          icon={CircleDot}
          tint="bg-emerald-500/10 text-emerald-600"
          loading={loading}
          failed={!!error}
        />
        <StatCard
          label="On delivery"
          value={String(active.filter((r) => r.status === 'on_delivery').length)}
          hint={`${active.filter((r) => r.status === 'busy').length} busy`}
          icon={Navigation}
          tint="bg-violet-500/10 text-violet-600"
          loading={loading}
          failed={!!error}
        />
        <StatCard
          label="Without a zone"
          value={String(unzoned)}
          hint={unzoned ? 'Assign them to start deliveries' : 'Every rider has a zone'}
          icon={MapPinOff}
          tint="bg-amber-500/10 text-amber-600"
          loading={loading}
          failed={!!error}
        />
      </div>

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="size-4" />
            Couldn’t load riders: {error}
          </div>
          <Button variant="outline" size="sm" onClick={() => void refresh()}>
            <RotateCw />
            Retry
          </Button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={riders}
        isLoading={loading}
        getRowId={(r) => String(r.id)}
        initialSorting={[{ id: 'rider', desc: false }]}
        searchPlaceholder="Search name, phone, email…"
        filters={[
          {
            columnId: 'status',
            title: 'Status',
            options: [...RIDER_STATUSES.map(({ value, label, icon }) => ({ value, label, icon })), { value: 'deactivated', label: 'Deactivated' }],
          },
          { columnId: 'zone', title: 'Zone', options: [{ value: NO_ZONE, label: 'No zone' }, ...zones.map((z) => ({ value: String(z.id), label: z.name }))] },
        ]}
        onRowClick={(r) => {
          setViewId(r.id);
          setViewOpen(true);
        }}
        emptyMessage={riders.length === 0 ? 'No riders yet. Add your first one.' : 'No riders match these filters.'}
        toolbarActions={
          can('riders.manage') && (
            <>
              <Button size="sm" variant="outline" className="h-8" onClick={() => setDispatchOpen(true)}>
                <Radar />
                Dispatch settings
              </Button>
              <Button size="sm" className="h-8" onClick={() => setCreateOpen(true)}>
                <Plus />
                Add rider
              </Button>
            </>
          )
        }
      />

      {viewing && (
        <RiderSheet
          key={viewing.id}
          rider={viewing}
          open={viewOpen}
          onOpenChange={setViewOpen}
          onAssignZone={() => {
            setZoneFor({ id: viewing.id, token: Date.now() });
            setZoneOpen(true);
          }}
          onToggleActive={() => setToggleFor(viewing)}
        />
      )}

      {zoneRider && zoneFor && (
        <AssignZoneDialog
          key={zoneFor.token}
          rider={zoneRider}
          zones={zones}
          open={zoneOpen}
          onOpenChange={setZoneOpen}
          onAssigned={(id, zone) => patchRider(id, { zoneId: zone.id, zone: zone.name })}
        />
      )}

      {dispatchOpen && <DispatchSettingsDialog onClose={() => setDispatchOpen(false)} />}
      <CreateRiderDialog open={createOpen} onOpenChange={setCreateOpen} zones={zones} onCreated={() => void refresh()} />

      <AlertDialog open={!!toggleFor} onOpenChange={(o) => !o && setToggleFor(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{toggleFor?.isActive ? `Deactivate ${toggleFor?.name}?` : `Reactivate ${toggleFor?.name}?`}</AlertDialogTitle>
            <AlertDialogDescription>
              {toggleFor?.isActive
                ? 'They won’t be offered new deliveries. Their history and earnings are kept, and you can reactivate them anytime.'
                : 'They’ll be able to take deliveries again.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant={toggleFor?.isActive ? 'destructive' : 'default'} onClick={() => void confirmToggle()}>
              {toggleFor?.isActive ? 'Deactivate' : 'Reactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
