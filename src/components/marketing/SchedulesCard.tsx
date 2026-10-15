import { useCallback, useEffect, useState } from 'react';
import { CalendarClock, Loader2, Megaphone, Pause, Play, Repeat, Square } from 'lucide-react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { MessageSchedule } from '../../services/marketingService';
import schedulesService from '../../services/marketing/schedulesService';
import { logger } from '../../utils/logger';
import { fmtRun } from './schedule-rules';
import { can } from '../../config/permissions';

const nameOf = (s: MessageSchedule) => (s.Campaign ? s.Campaign.name : s.name || s.title || 'Notification');

function stateOf(s: MessageSchedule) {
  if (s.active && s.nextRunAt) return { label: 'On', className: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700' };
  if (s.kind === 'campaign' && s.Campaign?.status === 'draft') return { label: 'Not launched', className: 'text-muted-foreground' };
  const finished = s.runCount > 0 && !s.nextRunAt && (s.frequency === 'once' || (s.endsOn && new Date(s.endsOn) < new Date()));
  return finished ? { label: 'Finished', className: 'text-muted-foreground' } : { label: 'Paused', className: 'border-amber-500/20 bg-amber-500/10 text-amber-700' };
}

/** Notifications and campaigns that go out later or repeatedly. Bump `refreshKey` after creating one. */
export default function SchedulesCard({ refreshKey, onChanged }: { refreshKey: number; onChanged?: () => void }) {
  const [items, setItems] = useState<MessageSchedule[] | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [toStop, setToStop] = useState<MessageSchedule | null>(null);

  const load = useCallback(async () => {
    try {
      setItems(await schedulesService.list());
    } catch (err) {
      logger.error('Failed to load schedules:', err);
      setItems((prev) => prev ?? []);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load, refreshKey]);

  const setActive = async (s: MessageSchedule, active: boolean) => {
    try {
      setBusy(s.id);
      const u = await schedulesService.update(s.id, { active });
      setItems((prev) => prev?.map((x) => (x.id === s.id ? { ...x, ...u } : x)) ?? null);
      toast.success(active ? `${nameOf(s)} is on again` : `${nameOf(s)} paused`, {
        description: active && u.nextRunAt ? `Next send ${fmtRun(u.nextRunAt)}.` : undefined,
      });
      onChanged?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Couldn’t update the schedule.');
    } finally {
      setBusy(null);
    }
  };

  const stop = async () => {
    const s = toStop;
    setToStop(null);
    if (!s) return;
    try {
      setBusy(s.id);
      await schedulesService.remove(s.id);
      toast.success(s.kind === 'campaign' ? `${nameOf(s)} ended` : `${nameOf(s)} stopped`);
      await load();
      onChanged?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Couldn’t stop the schedule.');
    } finally {
      setBusy(null);
    }
  };

  const visible = (items ?? []).filter((s) => !(s.kind === 'campaign' && s.Campaign?.status === 'ended'));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scheduled</CardTitle>
        <CardDescription>Notifications and campaigns that go out later or on repeat. Times are Ghana time.</CardDescription>
      </CardHeader>
      <CardContent>
        {items === null ? (
          <Skeleton className="h-16 w-full rounded-lg" />
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-8 text-center">
            <CalendarClock className="size-7 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Nothing scheduled. When sending, pick Later, Every day or Weekly under “When”.</p>
          </div>
        ) : (
          <ul className="divide-y rounded-lg border">
            {visible.map((s) => {
              const st = stateOf(s);
              const Icon = s.kind === 'campaign' ? Megaphone : s.frequency === 'once' ? CalendarClock : Repeat;
              const draft = s.kind === 'campaign' && s.Campaign?.status === 'draft';
              return (
                <li key={s.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                    <Icon className="size-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{nameOf(s)}</p>
                      {s.kind === 'campaign' && <span className="text-xs text-muted-foreground">Campaign</span>}
                      <Badge variant="outline" className={st.className}>
                        {st.label}
                      </Badge>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {s.summary}
                      {s.active && s.nextRunAt ? ` · next ${fmtRun(s.nextRunAt)}` : ''}
                      {s.runCount > 0 ? ` · sent ${s.runCount}×` : ''}
                    </p>
                    {s.lastError && <p className="truncate text-xs text-destructive">{s.lastError}</p>}
                  </div>
                  {!draft && st.label !== 'Finished' && (
                    <div className="flex shrink-0 gap-1.5">
                      {s.active ? (
                        can('notifications.send') || can('campaigns.launch') ? (
                          <Button size="sm" variant="outline" disabled={busy === s.id} onClick={() => void setActive(s, false)}>
                            {busy === s.id ? <Loader2 className="animate-spin" /> : <Pause />}
                            Pause
                          </Button>
                        ) : null
                      ) : can('notifications.send') || can('campaigns.launch') ? (
                        <Button size="sm" variant="outline" disabled={busy === s.id} onClick={() => void setActive(s, true)}>
                          {busy === s.id ? <Loader2 className="animate-spin" /> : <Play />}
                          Resume
                        </Button>
                      ) : null}
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" disabled={busy === s.id} onClick={() => setToStop(s)}>
                        <Square />
                        Stop
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>

      <AlertDialog open={!!toStop} onOpenChange={(o) => !o && setToStop(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Stop “{toStop ? nameOf(toStop) : ''}”?</AlertDialogTitle>
            <AlertDialogDescription>
              {toStop?.kind === 'campaign'
                ? 'No more sends go out and the campaign is marked ended. Its results stay.'
                : 'No more sends go out and it’s removed from this list. Messages already sent stay in the history.'}{' '}
              To take a break instead, use Pause.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => void stop()}>
              Stop
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
