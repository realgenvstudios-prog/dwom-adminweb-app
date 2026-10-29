import { useEffect, useSyncExternalStore } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import otpHelpService from '../services/otpHelpService';
import { can } from '../config/permissions';
import { logger } from '../utils/logger';

const POLL_MS = 20_000;

// How many customers are waiting for sign-in help, shared by the sidebar
// badge and the Support page.
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

export function useSignInHelpCount() {
  return useSyncExternalStore(subscribe, () => open);
}

/** Ask the server again now (e.g. after verifying or closing one). */
export async function refreshSignInHelpCount() {
  try {
    set((await otpHelpService.count()).open);
  } catch (err) {
    logger.warn('Could not load sign-in help count:', err);
  }
}

/**
 * Mount once, in the layout: keeps the count fresh and pops an alert when a
 * new customer asks, since they're waiting on the code screen.
 */
export function useSignInHelpAlerts() {
  const navigate = useNavigate();
  useEffect(() => {
    if (!can('support.view')) return;
    let last: number | null = null;
    let stopped = false;
    const check = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const n = (await otpHelpService.count()).open;
        if (stopped) return;
        if (last !== null && n > last) {
          toast.warning(n - last === 1 ? 'A customer needs help signing in' : `${n - last} customers need help signing in`, {
            description: 'Their code didn’t arrive. Call them and confirm their help code.',
            action: { label: 'Open', onClick: () => navigate('/support?tab=signin') },
            duration: 15000,
          });
        }
        last = n;
        set(n);
      } catch (err) {
        logger.warn('Could not check sign-in help:', err);
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
