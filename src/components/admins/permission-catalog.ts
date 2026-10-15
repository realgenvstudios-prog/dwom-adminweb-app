import { useEffect, useState } from 'react';
import adminsService from '../../services/adminsService';
import type { PermissionCatalog } from '../../services/admins/adminTypes';
import { reverseMapRole } from '../../services/admins/adminRoleMapping';
import { logger } from '../../utils/logger';

let cache: Promise<PermissionCatalog> | null = null;

/** The checkbox list and role defaults, loaded once per visit to the Admins page. */
export function usePermissionCatalog() {
  const [catalog, setCatalog] = useState<PermissionCatalog | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    cache ??= adminsService.getPermissionCatalog().catch((err) => {
      cache = null;
      throw err;
    });
    cache
      .then((c) => !cancelled && setCatalog(c))
      .catch((err) => {
        logger.error('Failed to load permission list:', err);
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return { catalog, failed };
}

/** A UI role's default boxes ("Operations" → its preset). Super Admin has everything. */
export function presetFor(catalog: PermissionCatalog, uiRole: string): string[] {
  if (uiRole === 'Super Admin') return catalog.groups.flatMap((g) => g.permissions.map((p) => p.key));
  return catalog.presets[reverseMapRole(uiRole)] ?? [];
}
