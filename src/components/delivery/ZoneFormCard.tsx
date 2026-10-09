import type { ChangeEvent, FormEvent } from "react";
import type { DeliveryZone } from "../../services/deliveryService";
import ZoneLocationPicker from "./ZoneLocationPicker";

interface ZoneFormCardProps {
  editingZone: DeliveryZone | null;
  formData: { name: string; lat: string; lng: string; radius: string; deliveryFee: string };
  setFormData: (updater: (prev: ZoneFormCardProps['formData']) => ZoneFormCardProps['formData']) => void;
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  saving: boolean;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
}

// The create/edit zone form card. Split out of the former monolithic
// DeliveryZonesPage.
export default function ZoneFormCard({
  editingZone,
  formData,
  setFormData,
  handleChange,
  saving,
  onSubmit,
  onCancel,
}: ZoneFormCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
      <h2 className="text-xl font-bold mb-4">
        {editingZone ? `Edit Zone: ${editingZone.name}` : "Create New Delivery Zone"}
      </h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Zone Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Accra Central, East Legon, Tema"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div className="md:col-span-2">
            <ZoneLocationPicker
              value={{
                lat: parseFloat(formData.lat) || 0,
                lng: parseFloat(formData.lng) || 0,
                radius: parseFloat(formData.radius) || 0,
              }}
              onChange={(v) =>
                setFormData((prev) => ({
                  ...prev,
                  lat: v.lat.toString(),
                  lng: v.lng.toString(),
                  radius: v.radius.toString(),
                }))
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Fee (GH₵) *</label>
            <input
              type="number"
              step="0.50"
              min="0"
              name="deliveryFee"
              value={formData.deliveryFee}
              onChange={handleChange}
              placeholder="e.g., 8.00"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Price charged to customer for delivery in this zone</p>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {editingZone ? "Updating..." : "Creating..."}
              </>
            ) : (
              editingZone ? "Update Zone" : "Create Zone"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
