import { CalendarClock, Repeat } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { DAYS, describe, fmtRun, ghanaToday, nextRun } from './schedule-rules';
import { toRepeat, whenProblem, type WhenMode, type WhenValue } from './when';

interface RepeatPickerProps {
  value: WhenValue;
  onChange: (v: WhenValue) => void;
  /** Label for the immediate option, e.g. "Now" or "On launch". */
  nowLabel?: string;
}

export default function RepeatPicker({ value: w, onChange, nowLabel = 'Now' }: RepeatPickerProps) {
  const set = (patch: Partial<WhenValue>) => onChange({ ...w, ...patch });
  const rule = toRepeat(w);
  const next = rule ? nextRun(rule) : null;
  const problem = whenProblem(w);

  return (
    <div className="grid gap-3">
      <Tabs value={w.mode} onValueChange={(v) => set({ mode: v as WhenMode })}>
        <TabsList className="grid h-9 w-full grid-cols-4">
          <TabsTrigger value="now" className="text-xs">
            {nowLabel}
          </TabsTrigger>
          <TabsTrigger value="once" className="text-xs">
            Later
          </TabsTrigger>
          <TabsTrigger value="daily" className="text-xs">
            Every day
          </TabsTrigger>
          <TabsTrigger value="weekly" className="text-xs">
            Weekly
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {w.mode !== 'now' && (
        <div className="grid gap-3 rounded-lg border bg-muted/30 p-3">
          {w.mode === 'weekly' && (
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">On</Label>
              <div className="flex flex-wrap gap-1.5">
                {DAYS.map((d) => {
                  const on = w.days.includes(d.value);
                  return (
                    <button
                      key={d.value}
                      type="button"
                      aria-pressed={on}
                      onClick={() => set({ days: on ? w.days.filter((x) => x !== d.value) : [...w.days, d.value] })}
                      className={cn(
                        'h-8 min-w-11 rounded-md border px-2 text-xs font-medium transition-colors',
                        on ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:bg-muted',
                      )}
                    >
                      {d.short}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className={cn('grid gap-3', w.mode === 'once' ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3')}>
            <div className="grid gap-1.5">
              <Label htmlFor="rp-start" className="text-xs text-muted-foreground">
                {w.mode === 'once' ? 'Date' : 'Starting'}
              </Label>
              <Input id="rp-start" type="date" value={w.startsOn} min={ghanaToday()} onChange={(e) => set({ startsOn: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="rp-time" className="text-xs text-muted-foreground">
                Time (Ghana)
              </Label>
              <Input id="rp-time" type="time" value={w.time} onChange={(e) => set({ time: e.target.value || '09:00' })} />
            </div>
            {w.mode !== 'once' && (
              <div className="col-span-2 grid gap-1.5 sm:col-span-1">
                <Label htmlFor="rp-end" className="text-xs text-muted-foreground">
                  Until
                </Label>
                <Input id="rp-end" type="date" value={w.endsOn} min={w.startsOn} onChange={(e) => set({ endsOn: e.target.value })} />
              </div>
            )}
          </div>
          {w.mode !== 'once' && (
            <p className="-mt-1 text-xs text-muted-foreground">{w.endsOn ? 'Stops after the last date.' : 'Leave “Until” empty to keep going until you stop it.'}</p>
          )}

          <div className={cn('flex items-start gap-2 rounded-md px-2.5 py-2 text-xs', problem ? 'bg-destructive/10 text-destructive' : 'bg-background text-muted-foreground')}>
            {w.mode === 'once' ? <CalendarClock className="mt-0.5 size-3.5 shrink-0" /> : <Repeat className="mt-0.5 size-3.5 shrink-0" />}
            <span>
              {problem ?? (
                <>
                  <span className="text-foreground">{describe(rule!)}</span>
                  {next && ` · First send ${fmtRun(next)}`}
                </>
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
