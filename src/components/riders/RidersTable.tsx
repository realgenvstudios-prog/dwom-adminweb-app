import type { RiderData } from "../../services/ridersService";
import { getStatusColor } from "./riderStatusColor";

interface RidersTableProps {
  filteredRiders: RiderData[];
  onViewDetails: (rider: RiderData) => void;
  onStatusChange: (rider: RiderData, newStatus: string) => void;
  onAssignZone: (rider: RiderData) => void;
  onDeactivate: (rider: RiderData) => void;
  onReactivate: (rider: RiderData) => void;
}

// The riders table. Split out of the former monolithic RidersPage.
export default function RidersTable({
  filteredRiders,
  onViewDetails,
  onStatusChange,
  onAssignZone,
  onDeactivate,
  onReactivate,
}: RidersTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-gray-500 border-b bg-gray-50">
            <th className="py-3 px-4 font-medium">Name</th>
            <th className="py-3 px-4 font-medium">Contact</th>
            <th className="py-3 px-4 font-medium">Vehicle</th>
            <th className="py-3 px-4 font-medium">Zone</th>
            <th className="py-3 px-4 font-medium">Status</th>
            <th className="py-3 px-4 font-medium">Rating</th>
            <th className="py-3 px-4 font-medium">Deliveries</th>
            <th className="py-3 px-4 font-medium">Earnings</th>
            <th className="py-3 px-4 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredRiders.length === 0 ? (
            <tr>
              <td colSpan={9} className="py-8 text-center text-gray-500">
                No riders found
              </td>
            </tr>
          ) : (
            filteredRiders.map((rider) => (
              <tr key={rider.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => onViewDetails(rider)}>
                <td className="py-4 px-4 font-medium">{rider.name}</td>
                <td className="py-4 px-4 text-gray-600">
                  <div className="text-sm">{rider.phone}</div>
                  <div className="text-xs text-gray-500">{rider.email}</div>
                </td>
                <td className="py-4 px-4">
                  <span className="capitalize text-xs bg-blue-50 px-2 py-1 rounded">
                    {rider.vehicleType}
                  </span>
                </td>
                <td className="py-4 px-4">{rider.zone}</td>
                <td className="py-4 px-4">
                  <select
                    value={rider.status}
                    onChange={(e) =>
                      onStatusChange(rider, e.target.value)
                    }
                    disabled={!rider.isActive}
                    className={`px-3 py-1 rounded text-xs font-medium border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 ${getStatusColor(
                      rider.status
                    )} ${!rider.isActive ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <option value="offline">Offline</option>
                    <option value="available">Available</option>
                    <option value="busy">Busy</option>
                    <option value="on_delivery">On Delivery</option>
                  </select>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">★</span>
                    <span className="font-semibold">{rider.rating.toFixed(1)}</span>
                  </div>
                </td>
                <td className="py-4 px-4 font-medium">{rider.totalDeliveries}</td>
                <td className="py-4 px-4 font-medium">
                  GH₵ {(rider.totalEarnings || 0).toFixed(2)}
                </td>
                <td className="py-4 px-4">
                  <div className="flex gap-2">
                    {rider.isActive ? (
                      <>
                        <button
                          onClick={(e) => {e.stopPropagation(); onAssignZone(rider);}}
                          className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                          title="Assign to zone"
                        >
                          Zone
                        </button>
                        <button
                          onClick={(e) => {e.stopPropagation(); onDeactivate(rider);}}
                          className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                          title="Deactivate rider"
                        >
                          Deactivate
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={(e) => {e.stopPropagation(); onReactivate(rider);}}
                        className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200"
                        title="Reactivate rider"
                      >
                        Reactivate
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
