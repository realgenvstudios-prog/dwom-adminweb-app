// Mirrors the backend's src/marketing/schedule-rules.ts so the form can
// preview the next send. Ghana time is UTC all year, so UTC maths is exact.
import type { RepeatInput } from '../../services/marketingService';

export const DAYS = [
  { value: 1, short: 'Mon', long: 'Monday' },
  { value: 2, short: 'Tue', long: 'Tuesday' },
  { value: 3, short: 'Wed', long: 'Wednesday' },
  { value: 4, short: 'Thu', long: 'Thursday' },
  { value: 5, short: 'Fri', long: 'Friday' },
  { value: 6, short: 'Sat', long: 'Saturday' },
  { value: 0, short: 'Sun', long: 'Sunday' },
];

const DAY_MS = 86_400_000;
const dayStart = (iso: string) => Date.parse(`${iso.slice(0, 10)}T00:00:00Z`);
const at = (day: number, time: string) => {
  const [h, m] = time.split(':').map(Number);
  return day + h * 3_600_000 + m * 60_000;
};

export function nextRun(r: RepeatInput, after = new Date()): Date | null {
  if (!/^\d{2}:\d{2}$/.test(r.timeOfDay) || !r.startsOn) return null;
  const first = dayStart(r.startsOn);
  const last = r.endsOn ? dayStart(r.endsOn) : Infinity;
  const now = after.getTime();
  if (r.frequency === 'once') {
    const t = at(first, r.timeOfDay);
    return t > now ? new Date(t) : null;
  }
  const days = r.frequency === 'weekly' ? new Set(r.daysOfWeek ?? []) : null;
  if (days && days.size === 0) return null;
  const today = Date.UTC(after.getUTCFullYear(), after.getUTCMonth(), after.getUTCDate());
  for (let day = Math.max(first, today); day <= last && day <= today + 8 * DAY_MS; day += DAY_MS) {
    if (days && !days.has(new Date(day).getUTCDay())) continue;
    const t = at(day, r.timeOfDay);
    if (t > now) return new Date(t);
  }
  return null;
}

const fmtDate = (d: Date | string) => new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });

/** "Tue 20 Oct, 09:00" in Ghana time. */
export const fmtRun = (d: Date | string) => `${fmtDate(d)}, ${new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}`;

export function describe(r: RepeatInput): string {
  const date = (iso: string) => new Date(dayStart(iso)).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  if (r.frequency === 'once') return `Once on ${date(r.startsOn)} at ${r.timeOfDay}`;
  const when =
    r.frequency === 'daily'
      ? 'Every day'
      : `Every ${DAYS.filter((d) => r.daysOfWeek?.includes(d.value))
          .map((d) => d.long)
          .join(', ')}`;
  return `${when} at ${r.timeOfDay}${r.endsOn ? ` until ${date(r.endsOn)}` : ', until stopped'}`;
}

/** Today's date in Ghana (UTC), as yyyy-mm-dd. */
export const ghanaToday = () => new Date().toISOString().slice(0, 10);
