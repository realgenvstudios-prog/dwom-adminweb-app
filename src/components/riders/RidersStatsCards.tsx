import type { RiderData } from "../../services/ridersService";

interface RidersStatsCardsProps {
  riders: RiderData[];
}

export default function RidersStatsCards({ riders }: RidersStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
      <div className="bg-white rounded-xl shadow p-6">
        <p className="text-sm text-gray-600 mb-2">Total Riders</p>
        <p className="text-4xl font-bold text-blue-600">{riders.length}</p>
        <p className="text-xs text-gray-500 mt-2">
          {riders.filter((r) => r.isActive).length} active
        </p>
      </div>
      <div className="bg-white rounded-xl shadow p-6">
        <p className="text-sm text-gray-600 mb-2">Available Now</p>
        <p className="text-4xl font-bold text-green-600">
          {riders.filter((r) => r.status === "available").length}
        </p>
        <p className="text-xs text-gray-500 mt-2">Ready for delivery</p>
      </div>
      <div className="bg-white rounded-xl shadow p-6">
        <p className="text-sm text-gray-600 mb-2">On Delivery</p>
        <p className="text-4xl font-bold text-blue-600">
          {riders.filter((r) => r.status === "on_delivery").length}
        </p>
        <p className="text-xs text-gray-500 mt-2">Active deliveries</p>
      </div>
      <div className="bg-white rounded-xl shadow p-6">
        <p className="text-sm text-gray-600 mb-2">Total Deliveries</p>
        <p className="text-4xl font-bold text-purple-600">
          {riders.reduce((sum, r) => sum + r.totalDeliveries, 0)}
        </p>
        <p className="text-xs text-gray-500 mt-2">All time</p>
      </div>
    </div>
  );
}
