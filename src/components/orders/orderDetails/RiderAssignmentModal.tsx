import type { Order } from "../OrderTypes";
import type { RiderData } from "../../../services/ridersService";

interface RiderAssignmentModalProps {
  order: Order;
  onClose: () => void;
  ridersLoading: boolean;
  availableRiders: RiderData[];
  selectedRiderId: number | null;
  setSelectedRiderId: (id: number | null) => void;
  loading: boolean;
  onAssign: () => void;
}

// The rider-assignment modal, local to OrderDetailsDrawer (see
// useRiderAssignment for why this isn't the shared AssignRiderModal).
// Split out of the former monolithic OrderDetailsDrawer.
export default function RiderAssignmentModal({
  order,
  onClose,
  ridersLoading,
  availableRiders,
  selectedRiderId,
  setSelectedRiderId,
  loading,
  onAssign,
}: RiderAssignmentModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">
            {order.rider ? 'Reassign Rider' : 'Assign Rider'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <span className="text-2xl font-light">×</span>
          </button>
        </div>

        {order.rider && (
          <div className="mb-4 p-3 bg-gray-100 rounded-lg">
            <div className="text-xs text-gray-600 font-semibold mb-1">CURRENT RIDER</div>
            <div className="text-sm font-bold text-gray-900">{order.rider.name}</div>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-900 mb-2">
            SELECT RIDER
          </label>
          {ridersLoading ? (
            <div className="flex items-center justify-center py-6">
              <svg className="animate-spin h-5 w-5 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="ml-2 text-sm text-gray-600">Loading riders...</span>
            </div>
          ) : availableRiders.length === 0 ? (
            <div className="py-6 text-center text-sm text-gray-500 bg-gray-50 rounded-lg">
              No active riders available
            </div>
          ) : (
            <select
              value={selectedRiderId || ''}
              onChange={(e) => setSelectedRiderId(Number(e.target.value) || null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
            >
              <option value="">Choose a rider...</option>
              {availableRiders.map((rider) => (
                <option key={rider.id} value={rider.id}>
                  {rider.name} • {rider.status} • {rider.zone || 'No zone'}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onAssign}
            disabled={loading || !selectedRiderId}
            className="flex-1 px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Assigning...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
