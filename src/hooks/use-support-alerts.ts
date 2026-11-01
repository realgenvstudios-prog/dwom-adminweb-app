import { useEffect, useSyncExternalStore } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import supportService from '../services/supportService';
import { can } from '../config/permissions';
import { logger } from '../utils/logger';

const POLL_MS = 20_000;

// How many customers are waiting for a support reply, for the sidebar badge.
let open = 0;
const listeners = new Set<() => void>();
const set = (n: number) => {
  if (n === open) return;
  open = n;
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useSupportWaitingCount() {
  return useSyncExternalStore(subscribe, () => open);
}

/** Mount once, in the layout: keeps the count fresh and pops an alert when someone new is waiting. */
export function useSupportAlerts() {
  const navigate = useNavigate();
  useEffect(() => {
    if (!can('support.view')) return;
    let last: number | null = null;
    let stopped = false;
    const check = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const n = (await supportService.waitingCount()).open;
        if (stopped) return;
        if (last !== null && n > last) {
          toast.info(n - last === 1 ? 'A customer sent a support message' : `${n - last} customers sent support messages`, {
            action: { label: 'Open', onClick: () => navigate('/support') },
            duration: 15000,
          });
        }
        last = n;
        set(n);
      } catch (err) {
        logger.warn('Could not check support messages:', err);
      }
    };
    void check();
    const id = setInterval(() => void check(), POLL_MS);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [navigate]);
}
