import { type OrderEvent, SUGGESTED_ORDER_EVENT_STAGES, formatStageLabel } from "../../../services/orderEventsService";

interface InternalTimelineSectionProps {
  eventsLoading: boolean;
  orderEvents: OrderEvent[];
  newEventStage: string;
  setNewEventStage: (stage: string) => void;
  newEventCustomStage: string;
  setNewEventCustomStage: (stage: string) => void;
  newEventPerformedBy: string;
  setNewEventPerformedBy: (name: string) => void;
  loggingEvent: boolean;
  onLogEvent: () => void;
}

// Internal (staff-only) fulfilment timeline — supplier contacted/paid,
// kayayo dispatched, arrived at hub, QC'd — plus the form to log a new
// step. Never shown to the customer. Split out of the former monolithic
// OrderDetailsDrawer.
export default function InternalTimelineSection({
  eventsLoading,
  orderEvents,
  newEventStage,
  setNewEventStage,
  newEventCustomStage,
  setNewEventCustomStage,
  newEventPerformedBy,
  setNewEventPerformedBy,
  loggingEvent,
  onLogEvent,
}: InternalTimelineSectionProps) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <div className="text-xs font-semibold text-gray-500 mb-3">🕒 INTERNAL TIMELINE (staff only)</div>

      {eventsLoading ? (
        <div className="text-sm text-gray-400 py-2">Loading…</div>
      ) : orderEvents.length === 0 ? (
        <div className="text-sm text-gray-400 py-2">No internal steps logged yet</div>
      ) : (
        <div className="space-y-2 mb-4">
          {orderEvents.map((event) => (
            <div key={event.id} className="flex items-start justify-between text-sm border-b border-gray-200 pb-2 last:border-0">
              <div>
                <div className="font-semibold text-gray-900">{formatStageLabel(event.stage)}</div>
                {event.performedBy && <div className="text-xs text-gray-500">by {event.performedBy}</div>}
                {event.notes && <div className="text-xs text-gray-500 italic">{event.notes}</div>}
              </div>
              <div className="text-xs text-gray-400 whitespace-nowrap ml-3">
                {new Date(event.occurredAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-end pt-2 border-t border-gray-200">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Step</label>
          <select
            value={newEventStage}
            onChange={(e) => setNewEventStage(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {SUGGESTED_ORDER_EVENT_STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {formatStageLabel(stage)}
              </option>
            ))}
            <option value="__custom__">Other…</option>
          </select>
        </div>
        {newEventStage === '__custom__' && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Custom step name</label>
            <input
              type="text"
              value={newEventCustomStage}
              onChange={(e) => setNewEventCustomStage(e.target.value)}
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. repackaged"
            />
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">By (optional)</label>
          <input
            type="text"
            value={newEventPerformedBy}
            onChange={(e) => setNewEventPerformedBy(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Ama"
          />
        </div>
        <button
          type="button"
          onClick={onLogEvent}
          disabled={loggingEvent || (newEventStage === '__custom__' && !newEventCustomStage.trim())}
          className="text-sm px-4 py-1.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {loggingEvent ? 'Logging…' : 'Log Step'}
        </button>
      </div>
    </div>
  );
}
