import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import orderEventsService, { type OrderEvent } from '../../../services/orderEventsService';
import { logger } from '../../../utils/logger';

// The internal (staff-only) fulfilment log — supplier contacted/paid, kayayo
// dispatched, arrived at hub, QC'd. Separate from the customer-facing status.
export function useOrderEvents(orderId: string | null) {
  const [events, setEvents] = useState<OrderEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [logging, setLogging] = useState(false);
  const idNum = orderId ? Number.parseInt(orderId, 10) : NaN;

  const load = useCallback(async () => {
    if (!Number.isFinite(idNum)) return;
    try {
      setLoading(true);
      setEvents(await orderEventsService.getForOrder(idNum));
    } catch (err) {
      logger.error('❌ [OrderDetails] Failed to load order timeline:', err);
    } finally {
      setLoading(false);
    }
  }, [idNum]);

  useEffect(() => {
    setEvents([]);
    load();
  }, [load]);

  const logEvent = async (stage: string, performedBy: string): Promise<boolean> => {
    if (!Number.isFinite(idNum) || !stage) return false;
    try {
      setLogging(true);
      await orderEventsService.logEvent(idNum, { stage, performedBy: performedBy || undefined });
      await load();
      toast.success('Step logged');
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to log this step');
      return false;
    } finally {
      setLogging(false);
    }
  };

  return { events, loading, logging, logEvent };
}
