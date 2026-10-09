import type { DeliveryZone } from "../../services/deliveryService";

interface ZoneCardProps {
  zone: DeliveryZone;
  onEdit: (zone: DeliveryZone) => void;
  onToggle: (zone: DeliveryZone) => void;
  onDelete: (zone: DeliveryZone) => void;
}

// A single delivery-zone card. Split out of the former monolithic
// DeliveryZonesPage.
export default function ZoneCard({ zone, onEdit, onToggle, onDelete }: ZoneCardProps) {
  const riderCount = zone.Rider?.length || 0;

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-5 transition hover:shadow-md ${zone.isActive ? "border-green-200" : "border-gray-300 opacity-75"}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-bold text-gray-900 text-lg">{zone.name}</h4>
          {zone.description && <p className="text-sm text-gray-500 mt-0.5">{zone.description}</p>}
        </div>
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${zone.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {zone.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
        <div>
          <span className="text-gray-500">Delivery Fee</span>
          <div className="font-bold text-lg text-gray-900">GH₵{zone.deliveryFee.toFixed(2)}</div>
        </div>
        <div>
          <span className="text-gray-500">Radius</span>
          <div className="font-bold text-gray-900">{zone.radius} km</div>
        </div>
        <div>
          <span className="text-gray-500">Center</span>
          <div className="font-mono text-xs text-gray-700">{zone.lat.toFixed(4)}, {zone.lng.toFixed(4)}</div>
        </div>
        <div>
          <span className="text-gray-500">Riders</span>
          <div className="font-bold text-gray-900">{riderCount}</div>
        </div>
      </div>

      <div className="flex gap-2 border-t border-gray-100 pt-3">
        <button
          onClick={() => onEdit(zone)}
          className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
        >
          Edit
        </button>
        <button
          onClick={() => onToggle(zone)}
          className={`flex-1 px-3 py-1.5 text-sm rounded-lg ${zone.isActive ? "bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100" : "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"}`}
        >
          {zone.isActive ? "Disable" : "Enable"}
        </button>
        <button
          onClick={() => onDelete(zone)}
          className="px-3 py-1.5 text-sm bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
