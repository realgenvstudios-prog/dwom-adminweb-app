import type { RepeatInput } from '../../services/marketingService';
import { nextRun } from './schedule-rules';

export type WhenMode = 'now' | 'once' | 'daily' | 'weekly';

export interface WhenValue {
  mode: WhenMode;
  days: number[];
  time: string;
  startsOn: string;
  /** '' = until stopped */
  endsOn: string;
}

/** Starts on "now", with the next full hour ready if they switch to a later time. */
export const defaultWhen = (): WhenValue => {
  const next = new Date(Date.now() + 3_600_000);
  next.setUTCMinutes(0, 0, 0);
  return { mode: 'now', days: [], time: next.toISOString().slice(11, 16), startsOn: next.toISOString().slice(0, 10), endsOn: '' };
};

/** The repeat rule to send, or null for "now". */
export function toRepeat(w: WhenValue): RepeatInput | null {
  if (w.mode === 'now') return null;
  return {
    frequency: w.mode,
    daysOfWeek: w.mode === 'weekly' ? w.days : undefined,
    timeOfDay: w.time,
    startsOn: w.startsOn,
    endsOn: w.mode === 'once' ? null : w.endsOn || null,
  };
}

/** A problem with the chosen timing, or null when it's fine. */
export function whenProblem(w: WhenValue): string | null {
  if (w.mode === 'now') return null;
  if (w.mode === 'weekly' && w.days.length === 0) return 'Pick at least one day of the week.';
  if (w.endsOn && w.endsOn < w.startsOn) return 'The end date is before the start date.';
  if (!nextRun(toRepeat(w)!)) return 'That time has already passed. Pick a later date or time.';
  return null;
}
