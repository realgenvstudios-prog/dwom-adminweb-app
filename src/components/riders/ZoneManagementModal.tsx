import React, { useState, useEffect } from "react";
import ridersService from "../../services/ridersService";
import type { Zone } from "../../services/ridersService";

interface ZoneManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ZoneManagementModal: React.FC<ZoneManagementModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(false);
  const [creatingZone, setCreatingZone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    lat: "",
    lng: "",
    radius: "",
    deliveryFee: "",
  });

  useEffect(() => {
    if (isOpen) {
      fetchZones();
    }
  }, [isOpen]);

  const fetchZones = async () => {
    try {
      setLoading(true);
      const data = await ridersService.getAllZones();
      setZones(data);
    } catch (err: any) {
      console.error("Failed to fetch zones:", err);
      setError("Failed to load zones");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.lat || !formData.lng || !formData.radius) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setCreatingZone(true);
      setError(null);

      await ridersService.createZone({
        name: formData.name,
        description: formData.description || undefined,
        lat: parseFloat(formData.lat),
        lng: parseFloat(formData.lng),
        radius: parseFloat(formData.radius),
        deliveryFee: formData.deliveryFee ? parseFloat(formData.deliveryFee) : undefined,
      });

      console.log("✅ Zone created successfully");
      setFormData({
        name: "",
        description: "",
        lat: "",
        lng: "",
        radius: "",
        deliveryFee: "",
      });
      setShowForm(false);
      fetchZones();
      onSuccess();
    } catch (err: any) {
      console.error("❌ Failed to create zone:", err);
      setError(err.message || "Failed to create zone");
    } finally {
      setCreatingZone(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Manage Zones</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <svg
              className="animate-spin h-8 w-8 text-blue-600"
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
          <>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="mb-6 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Create New Zone
              </button>
            )}

            {showForm && (
              <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4 border border-gray-200">
                <h3 className="font-bold text-lg mb-4">Create New Zone</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Zone Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g., Accra Central"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Zone description"
                      rows={2}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Latitude *
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      name="lat"
                      value={formData.lat}
                      onChange={handleChange}
                      placeholder="e.g., 5.6037"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Longitude *
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      name="lng"
                      value={formData.lng}
                      onChange={handleChange}
                      placeholder="e.g., -0.1870"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Radius (km) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      name="radius"
                      value={formData.radius}
                      onChange={handleChange}
                      placeholder="e.g., 5"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Fee (Optional)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="deliveryFee"
                      value={formData.deliveryFee}
                      onChange={handleChange}
                      placeholder="e.g., 5.00"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setFormData({
                        name: "",
                        description: "",
                        lat: "",
                        lng: "",
                        radius: "",
                        deliveryFee: "",
                      });
                      setError(null);
                    }}
                    disabled={creatingZone}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingZone}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {creatingZone ? (
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
                        Creating...
                      </>
                    ) : (
                      "Create Zone"
                    )}
                  </button>
                </div>
              </form>
            )}

            <h3 className="font-bold text-lg mb-4">Existing Zones ({zones.length})</h3>

            {zones.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No zones created yet
              </div>
            ) : (
              <div className="space-y-3">
                {zones.map((zone) => (
                  <div
                    key={zone.id}
                    className="p-4 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900">{zone.name}</h4>
                        {zone.isActive && (
                          <span className="inline-block mt-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                            Active
                          </span>
                        )}
                        <div className="mt-2 text-sm text-gray-600 space-y-1">
                          <p>📍 Coordinates: {zone.code || "N/A"}</p>
                          {zone.deliveryFee && <p>💰 Delivery Fee: GH₵ {zone.deliveryFee}</p>}
                          {zone.estimatedTime && <p>⏱️ Est. Time: {zone.estimatedTime} min</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 mt-6 pt-4 border-t">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ZoneManagementModal;
