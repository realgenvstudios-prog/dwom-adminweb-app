import { useEffect, useSyncExternalStore } from 'react';
import adminAuthService from '../services/authService';
import { logger } from '../utils/logger';
import { can, permissionsChanged, permissionsVersion, subscribePermissions } from '../config/permissions';

/** Re-renders when the admin's permissions change; returns the `can` checker. */
export function usePermissions() {
  useSyncExternalStore(subscribePermissions, permissionsVersion);
  return can;
}

/**
 * Re-reads the signed-in admin's profile (and so their ticked permissions)
 * when the dashboard opens and whenever the tab regains focus, so a Super
 * Admin's change shows up without signing out. Mount once, in the layout.
 */
export function useRefreshPermissions() {
  useEffect(() => {
    let last = 0;
    const refresh = () => {
      if (Date.now() - last < 15_000) return;
      last = Date.now();
      adminAuthService
        .verifyToken()
        .then((ok) => ok && permissionsChanged())
        .catch((err) => logger.warn('Could not refresh permissions:', err));
    };
    refresh();
    const onFocus = () => document.visibilityState === 'visible' && refresh();
    document.addEventListener('visibilitychange', onFocus);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onFocus);
      window.removeEventListener('focus', onFocus);
    };
  }, []);
}
