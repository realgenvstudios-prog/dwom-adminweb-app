import { useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { SUGGESTED_ORDER_EVENT_STAGES, formatStageLabel } from '../../../services/orderEventsService';
import { formatDateTime, orderStatusMeta } from '../order-status';
import type { StatusChange } from './useOrderDetails';
import { useOrderEvents } from './useOrderEvents';

const CUSTOM = '__custom__';

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</h3>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function StatusTimeline({ history, loading }: { history: StatusChange[]; loading: boolean }) {
  if (loading) return <Skeleton className="h-24 w-full" />;
  if (history.length === 0) return <p className="text-sm text-muted-foreground">No status changes recorded.</p>;

  return (
    <ol className="relative space-y-4 border-l pl-6">
      {history.map((h, i) => {
        const meta = orderStatusMeta(h.status);
        const latest = i === history.length - 1;
        return (
          <li key={h.id} className="relative">
            <span
              className={cn(
                'absolute top-0.5 -left-[33px] flex size-5 items-center justify-center rounded-full border bg-background',
                latest && 'border-primary',
              )}
            >
              <meta.icon className={cn('size-3', meta.tone)} />
            </span>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <p className={cn('text-sm', latest && 'font-medium')}>{meta.label}</p>
              <time className="text-xs text-muted-foreground">{formatDateTime(h.changedAt)}</time>
            </div>
            <p className="text-xs text-muted-foreground capitalize">by {h.changedBy}</p>
            {h.notes && <p className="text-xs text-muted-foreground italic">{h.notes}</p>}
          </li>
        );
      })}
    </ol>
  );
}

interface ActivityTabProps {
  orderId: string;
  history: StatusChange[];
  historyLoading: boolean;
}

export default function ActivityTab({ orderId, history, historyLoading }: ActivityTabProps) {
  const { events, loading, logging, logEvent } = useOrderEvents(orderId);
  const [stage, setStage] = useState<string>(SUGGESTED_ORDER_EVENT_STAGES[0]);
  const [customStage, setCustomStage] = useState('');
  const [performedBy, setPerformedBy] = useState('');
  const resolvedStage = stage === CUSTOM ? customStage.trim() : stage;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await logEvent(resolvedStage, performedBy.trim())) {
      setCustomStage('');
      setPerformedBy('');
    }
  };

  return (
    <div className="space-y-8">
      <Section title="Status history">
        <StatusTimeline history={history} loading={historyLoading} />
      </Section>

      <Section title="Fulfilment log" hint="Staff only. Never shown to the customer.">
        {loading ? (
          <Skeleton className="h-16 w-full" />
        ) : events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No fulfilment steps logged yet.</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {events.map((ev) => (
              <li key={ev.id} className="flex items-start justify-between gap-3 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{formatStageLabel(ev.stage)}</p>
                  {ev.performedBy && <p className="text-xs text-muted-foreground">by {ev.performedBy}</p>}
                  {ev.notes && <p className="text-xs text-muted-foreground italic">{ev.notes}</p>}
                </div>
                <time className="shrink-0 text-xs text-muted-foreground">{formatDateTime(ev.occurredAt)}</time>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={submit} className="grid gap-3 rounded-lg border bg-muted/30 p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div className="grid gap-1.5">
            <Label htmlFor="event-stage" className="text-xs">
              Step
            </Label>
            <Select value={stage} onValueChange={setStage}>
              <SelectTrigger id="event-stage" size="sm" className="w-full bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUGGESTED_ORDER_EVENT_STAGES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {formatStageLabel(s)}
                  </SelectItem>
                ))}
                <SelectItem value={CUSTOM}>Other…</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="event-by" className="text-xs">
              By (optional)
            </Label>
            <Input
              id="event-by"
              value={performedBy}
              onChange={(e) => setPerformedBy(e.target.value)}
              placeholder="e.g. Ama"
              className="h-8 bg-background"
            />
          </div>
          <Button type="submit" size="sm" disabled={logging || !resolvedStage}>
            {logging ? <Loader2 className="animate-spin" /> : <Plus />}
            Log step
          </Button>
          {stage === CUSTOM && (
            <div className="grid gap-1.5 sm:col-span-3">
              <Label htmlFor="event-custom" className="text-xs">
                Custom step name
              </Label>
              <Input
                id="event-custom"
                value={customStage}
                onChange={(e) => setCustomStage(e.target.value)}
                placeholder="e.g. repackaged"
                className="h-8 bg-background"
                autoFocus
              />
            </div>
          )}
        </form>
      </Section>
    </div>
  );
}
