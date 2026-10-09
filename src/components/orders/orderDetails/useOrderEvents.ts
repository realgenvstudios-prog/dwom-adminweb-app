import { useEffect, useState } from "react";
import orderEventsService, { type OrderEvent, SUGGESTED_ORDER_EVENT_STAGES } from "../../../services/orderEventsService";

// The internal (staff-only) fulfilment timeline — supplier contacted/paid,
// kayayo dispatched, arrived at hub, QC'd. Separate from the customer-
// facing order status. Split out of the former monolithic
// OrderDetailsDrawer.
export function useOrderEvents(orderIdNum: number | null, open: boolean) {
  const [orderEvents, setOrderEvents] = useState<OrderEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [newEventStage, setNewEventStage] = useState<string>(SUGGESTED_ORDER_EVENT_STAGES[0]);
  const [newEventCustomStage, setNewEventCustomStage] = useState("");
  const [newEventPerformedBy, setNewEventPerformedBy] = useState("");
  const [loggingEvent, setLoggingEvent] = useState(false);

  const loadOrderEvents = async () => {
    if (!orderIdNum) return;
    try {
      setEventsLoading(true);
      const events = await orderEventsService.getForOrder(orderIdNum);
      setOrderEvents(events);
    } catch (e: any) {
      console.error('❌ [OrderDetailsDrawer] Failed to load order timeline:', e);
    } finally {
      setEventsLoading(false);
    }
  };

  useEffect(() => {
    if (!open || !orderIdNum) return;
    loadOrderEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, orderIdNum]);

  const handleLogEvent = async () => {
    if (!orderIdNum) return;
    const stage = newEventStage === '__custom__' ? newEventCustomStage.trim() : newEventStage;
    if (!stage) return;
    try {
      setLoggingEvent(true);
      await orderEventsService.logEvent(orderIdNum, {
        stage,
        performedBy: newEventPerformedBy.trim() || undefined,
      });
      setNewEventCustomStage('');
      setNewEventPerformedBy('');
      await loadOrderEvents();
    } catch (e: any) {
      alert(e?.message || 'Failed to log this step');
    } finally {
      setLoggingEvent(false);
    }
  };

  return {
    orderEvents,
    eventsLoading,
    newEventStage,
    setNewEventStage,
    newEventCustomStage,
    setNewEventCustomStage,
    newEventPerformedBy,
    setNewEventPerformedBy,
    loggingEvent,
    handleLogEvent,
  };
}
