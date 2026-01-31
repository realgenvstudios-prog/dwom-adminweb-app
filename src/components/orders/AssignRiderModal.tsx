import React, { useState, useEffect } from "react";
import ridersService from "../../services/ridersService";
import adminApiClient from "../../services/apiClient";
import type { RiderData } from "../../services/ridersService";

interface AssignRiderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
  onSuccess: () => void;
}

const AssignRiderModal: React.FC<AssignRiderModalProps> = ({
  isOpen,
  onClose,
  orderId,
  onSuccess,
}) => {
  const [riders, setRiders] = useState<RiderData[]>([]);
  const [selectedRiderId, setSelectedRiderId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchAvailableRiders();
    }
  }, [isOpen]);

  const fetchAvailableRiders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ridersService.getAllRiders();
      // Filter for active riders only
      const activeRiders = data.filter((r) => r.isActive);
      setRiders(activeRiders);
    } catch (err: any) {
      console.error("Failed to fetch riders:", err);
      setError(err.message || "Failed to load riders");
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedRiderId) {
      setError("Please select a rider");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await adminApiClient.post(`/orders/${orderId}/assign-rider`, {
        riderId: selectedRiderId,
      });

      console.log(`✅ Rider ${selectedRiderId} assigned to order ${orderId}`);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Failed to assign rider:", err);
      setError(err.message || "Failed to assign rider");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">Assign Rider</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        {loading && !riders.length ? (
          <div className="flex items-center justify-center py-8">
            <svg
              className="animate-spin h-6 w-6 text-blue-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
        ) : (
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Rider
              </label>
              <select
                value={selectedRiderId || ""}
                onChange={(e) => setSelectedRiderId(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a rider...</option>
                {riders.map((rider) => (
                  <option key={rider.id} value={rider.id}>
                    {rider.name} - {rider.phone} ({rider.zone})
                  </option>
                ))}
              </select>
              {riders.length === 0 && !loading && (
                <p className="text-gray-500 text-sm mt-2">No active riders available</p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssign}
                disabled={loading || !selectedRiderId}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Assigning...
                  </>
                ) : (
                  "Assign Rider"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignRiderModal;
