import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

// Active tab lives in ?tab= so the sidebar can deep-link to a tab and a
// refresh/shared link lands on the same one. Unknown values fall back.
export function useTabParam<T extends string>(
  tabs: readonly T[],
  fallback: T,
): [T, (tab: T) => void] {
  const [params, setParams] = useSearchParams();
  const raw = params.get('tab');
  const active = tabs.includes(raw as T) ? (raw as T) : fallback;

  const setActive = useCallback(
    (tab: T) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (tab === fallback) next.delete('tab');
          else next.set('tab', tab);
          return next;
        },
        { replace: true },
      );
    },
    [setParams, fallback],
  );

  return [active, setActive];
}
