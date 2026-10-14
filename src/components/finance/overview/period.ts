// The period the Finance overview shows. Ghana time is UTC all year, so
// every date here is a UTC calendar date (yyyy-mm-dd).

export type PeriodMode = 'day' | 'week' | 'month' | 'year' | 'custom' | 'all';

export interface Period {
  mode: PeriodMode;
  /** Any date inside the day/week/month/year being shown. */
  anchor: string;
  /** Custom range, inclusive. */
  from: string;
  to: string;
}

export interface Range {
  start: string | null; // null = all time
  end: string;
  compareStart?: string;
  compareEnd?: string;
  label: string;
  /** e.g. "vs last week"; undefined when there's nothing to compare with. */
  compareLabel?: string;
}

const iso = (t: number) => new Date(t).toISOString().slice(0, 10);
const parse = (d: string) => Date.parse(`${d}T00:00:00Z`);
const DAY = 86_400_000;
export const todayIso = () => new Date().toISOString().slice(0, 10);

const fmt = (d: string, opts: Intl.DateTimeFormatOptions) => new Date(parse(d)).toLocaleDateString('en-GB', { ...opts, timeZone: 'UTC' });

function monthBounds(y: number, m: number) {
  return { start: iso(Date.UTC(y, m, 1)), end: iso(Date.UTC(y, m + 1, 0)) };
}

function weekStart(d: string) {
  const t = parse(d);
  return t - ((new Date(t).getUTCDay() + 6) % 7) * DAY; // Monday
}

export function rangeOf(p: Period): Range {
  const a = new Date(parse(p.anchor));
  const thisYear = new Date().getUTCFullYear();
  switch (p.mode) {
    case 'day': {
      const prev = iso(parse(p.anchor) - DAY);
      const isToday = p.anchor === todayIso();
      return {
        start: p.anchor,
        end: p.anchor,
        compareStart: prev,
        compareEnd: prev,
        label: isToday ? `Today, ${fmt(p.anchor, { day: 'numeric', month: 'short' })}` : fmt(p.anchor, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
        compareLabel: isToday ? 'vs yesterday' : 'vs the day before',
      };
    }
    case 'week': {
      const s = weekStart(p.anchor);
      const e = s + 6 * DAY;
      const sameMonth = new Date(s).getUTCMonth() === new Date(e).getUTCMonth();
      return {
        start: iso(s),
        end: iso(e),
        compareStart: iso(s - 7 * DAY),
        compareEnd: iso(s - DAY),
        label: `${fmt(iso(s), sameMonth ? { day: 'numeric' } : { day: 'numeric', month: 'short' })} – ${fmt(iso(e), { day: 'numeric', month: 'short', year: 'numeric' })}`,
        compareLabel: 'vs the week before',
      };
    }
    case 'month': {
      const y = a.getUTCFullYear();
      const m = a.getUTCMonth();
      const cur = monthBounds(y, m);
      const prev = monthBounds(y, m - 1);
      return {
        ...cur,
        compareStart: prev.start,
        compareEnd: prev.end,
        label: fmt(cur.start, { month: 'long', year: 'numeric' }),
        compareLabel: `vs ${fmt(prev.start, { month: 'long' })}`,
      };
    }
    case 'year': {
      const y = a.getUTCFullYear();
      return {
        start: `${y}-01-01`,
        end: `${y}-12-31`,
        compareStart: `${y - 1}-01-01`,
        compareEnd: `${y - 1}-12-31`,
        label: y === thisYear ? `${y} so far` : String(y),
        compareLabel: `vs ${y - 1}`,
      };
    }
    case 'custom': {
      const from = p.from <= p.to ? p.from : p.to;
      const to = p.from <= p.to ? p.to : p.from;
      const days = Math.round((parse(to) - parse(from)) / DAY) + 1;
      return {
        start: from,
        end: to,
        compareStart: iso(parse(from) - days * DAY),
        compareEnd: iso(parse(from) - DAY),
        label: `${fmt(from, { day: 'numeric', month: 'short', year: 'numeric' })} – ${fmt(to, { day: 'numeric', month: 'short', year: 'numeric' })}`,
        compareLabel: `vs the ${days} day${days === 1 ? '' : 's'} before`,
      };
    }
    default:
      return { start: null, end: todayIso(), label: 'All time' };
  }
}

/** Moves a day/week/month/year period back (-1) or forward (+1). */
export function shift(p: Period, dir: -1 | 1): Period {
  const a = new Date(parse(p.anchor));
  let next: number;
  if (p.mode === 'day') next = parse(p.anchor) + dir * DAY;
  else if (p.mode === 'week') next = parse(p.anchor) + dir * 7 * DAY;
  else if (p.mode === 'month') next = Date.UTC(a.getUTCFullYear(), a.getUTCMonth() + dir, 1);
  else if (p.mode === 'year') next = Date.UTC(a.getUTCFullYear() + dir, 0, 1);
  else return p;
  return { ...p, anchor: iso(next) };
}

/** True when moving forward would only show days that haven't happened. */
export function atLatest(p: Period): boolean {
  const r = rangeOf(p);
  return p.mode === 'all' || p.mode === 'custom' || r.end >= todayIso();
}

/** The range the P&L chart should bucket by, for a period of this length. */
export function bucketFor(r: Range): 'daily' | 'weekly' | 'monthly' {
  if (!r.start) return 'monthly';
  const days = (parse(r.end) - parse(r.start)) / DAY + 1;
  return days <= 45 ? 'daily' : days <= 200 ? 'weekly' : 'monthly';
}

/** The date n days before today (yyyy-mm-dd). */
export const daysAgoIso = (n: number) => iso(parse(todayIso()) - n * DAY);
