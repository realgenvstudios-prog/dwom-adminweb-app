import { useCallback, useEffect, useState } from 'react';
import ridersService, { type RiderData, type Zone } from '../../services/ridersService';
import { logger } from '../../utils/logger';

/** Riders + zones. zoneId is nullable on the API (riders can be unzoned). */
export type Rider = Omit<RiderData, 'zoneId'> & { zoneId: number | null };

export function useRidersData() {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [r, z] = await Promise.all([ridersService.getAllRiders(), ridersService.getAllZones()]);
      setRiders((r ?? []) as Rider[]);
      setZones(z ?? []);
    } catch (err) {
      logger.error('❌ [RidersTab] Failed to fetch riders:', err);
      setError(err instanceof Error ? err.message : 'Failed to load riders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  const patchRider = useCallback((id: number, patch: Partial<Rider>) => {
    setRiders((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }, []);

  return { riders, zones, loading, error, refresh: load, patchRider };
}
