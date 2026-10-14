import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { atLatest, rangeOf, shift, todayIso, type Period, type PeriodMode } from './period';

const MODES: { value: PeriodMode; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
  { value: 'custom', label: 'Custom' },
  { value: 'all', label: 'All time' },
];

/** Pick the period the Finance overview shows: a day, week, month or year (with arrows), a custom range, or all time. */
export default function PeriodBar({ value: p, onChange }: { value: Period; onChange: (p: Period) => void }) {
  const r = rangeOf(p);
  const stepped = p.mode !== 'custom' && p.mode !== 'all';
  const isCurrent = stepped && r.start! <= todayIso() && r.end >= todayIso();

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
      <Tabs value={p.mode} onValueChange={(v) => onChange({ ...p, mode: v as PeriodMode })}>
        <TabsList className="h-9 w-full overflow-x-auto sm:w-auto">
          {MODES.map((m) => (
            <TabsTrigger key={m.value} value={m.value} className="px-2.5 text-xs">
              {m.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {stepped && (
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="icon-sm" onClick={() => onChange(shift(p, -1))} aria-label="Previous period">
            <ChevronLeft />
          </Button>
          <label className="relative">
            <span className="block min-w-40 rounded-md px-2 py-1 text-center text-sm font-medium tabular-nums">{r.label}</span>
            {/* Jump to any date: the period becomes the day/week/month/year containing it. */}
            <input
              type="date"
              aria-label="Jump to a date"
              value={p.anchor}
              max={todayIso()}
              onChange={(e) => e.target.value && onChange({ ...p, anchor: e.target.value })}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </label>
          <Button variant="outline" size="icon-sm" onClick={() => onChange(shift(p, 1))} disabled={atLatest(p)} aria-label="Next period">
            <ChevronRight />
          </Button>
          {!isCurrent && (
            <Button variant="ghost" size="sm" className="h-8" onClick={() => onChange({ ...p, anchor: todayIso() })}>
              {p.mode === 'day' ? 'Today' : `This ${p.mode}`}
            </Button>
          )}
        </div>
      )}

      {p.mode === 'custom' && (
        <div className="flex items-center gap-2">
          <Input
            type="date"
            aria-label="From"
            value={p.from}
            max={todayIso()}
            onChange={(e) => e.target.value && onChange({ ...p, from: e.target.value })}
            className="h-8 w-auto"
          />
          <span className="text-sm text-muted-foreground">to</span>
          <Input type="date" aria-label="To" value={p.to} max={todayIso()} onChange={(e) => e.target.value && onChange({ ...p, to: e.target.value })} className="h-8 w-auto" />
        </div>
      )}

      {p.mode === 'all' && <p className="text-sm text-muted-foreground">Every order since DWOM started</p>}
    </div>
  );
}
