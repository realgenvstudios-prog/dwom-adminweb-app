import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { daysAgoIso, todayIso, type Period, type PeriodMode } from './period';

const MODES: PeriodMode[] = ['day', 'week', 'month', 'year', 'custom', 'all'];
const isDate = (v: string | null): v is string => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);

/** The overview's period lives in the URL (?period=month&date=…), so a link opens the same view. Defaults to this month. */
export function usePeriodParam(): [Period, (p: Period) => void] {
  const [params, setParams] = useSearchParams();
  const raw = params.get('period') as PeriodMode | null;
  const today = todayIso();
  const monthAgo = daysAgoIso(29);
  const period: Period = {
    mode: raw && MODES.includes(raw) ? raw : 'month',
    anchor: isDate(params.get('date')) ? params.get('date')! : today,
    from: isDate(params.get('from')) ? params.get('from')! : monthAgo,
    to: isDate(params.get('to')) ? params.get('to')! : today,
  };

  const setPeriod = useCallback(
    (p: Period) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('period', p.mode);
          for (const k of ['date', 'from', 'to']) next.delete(k);
          if (p.mode === 'custom') {
            next.set('from', p.from);
            next.set('to', p.to);
          } else if (p.mode !== 'all' && p.anchor !== todayIso()) {
            next.set('date', p.anchor);
          }
          return next;
        },
        { replace: true },
      ),
    [setParams],
  );

  return [period, setPeriod];
}
