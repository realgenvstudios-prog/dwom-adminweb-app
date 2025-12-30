import React, { useState, useEffect } from "react";
import type { RiderData, Zone } from "../../services/ridersService";
import ridersService from "../../services/ridersService";

interface AssignZoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  rider: RiderData | null;
  zones: Zone[];
  onSuccess: () => void;
}

const AssignZoneModal: React.FC<AssignZoneModalProps> = ({
  isOpen,
  onClose,
  rider,
  zones,
  onSuccess,
}) => {
  const [selectedZoneId, setSelectedZoneId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && rider) {
      setSelectedZoneId(rider.zoneId.toString());
      setError(null);
    }
  }, [isOpen, rider]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedZoneId) {
      setError("Please select a zone");
      return;
    }

    if (!rider) return;

    try {
      setLoading(true);
      setError(null);

      const zoneId = parseInt(selectedZoneId);
      if (zoneId === rider.zoneId) {
        setError("Please select a different zone");
        return;
      }

      await ridersService.assignZone(rider.id, zoneId);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Failed to assign zone:", err);
      setError(err.message || "Failed to assign zone");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !rider) return null;

  const currentZone = zones.find((z) => z.id === rider.zoneId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">Assign Zone</h2>
        <p className="text-gray-600 mb-6">
          Change delivery zone for <span className="font-semibold">{rider.name}</span>
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Zone
            </label>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="font-semibold">{currentZone?.name || "Unknown"}</p>
              <p className="text-xs text-gray-600">Fee: GH₵{currentZone?.deliveryFee || 0}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Zone
            </label>
            <select
              value={selectedZoneId}
              onChange={(e) => setSelectedZoneId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name} - GH₵{zone.deliveryFee}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-yellow-50 p-3 rounded-lg">
            <p className="text-xs text-yellow-800">
              ⚠️ The rider's status will remain unchanged. Manual update of backend required.
            </p>
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
              type="submit"
              disabled={loading}
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
                  Updating...
                </>
              ) : (
                "Assign Zone"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignZoneModal;
