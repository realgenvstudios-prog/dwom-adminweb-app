import React from "react";
import type { RiderStats } from "./RiderTypes";

const RiderSummaryCard: React.FC<{ stats: RiderStats }> = ({ stats }) => (
  <div className="bg-white rounded-xl shadow p-6 mb-6">
    <h3 className="text-lg font-semibold mb-4">Rider Summary</h3>
    <div className="grid grid-cols-2 gap-4">
      <div className="flex flex-col items-center">
        <span className="text-2xl font-bold text-gray-900">{stats.totalRiders}</span>
        <span className="text-xs text-gray-500">Total Riders</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-2xl font-bold text-green-700">{stats.online}</span>
        <span className="text-xs text-gray-500">Online Now</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-2xl font-bold text-yellow-700">{stats.onDelivery}</span>
        <span className="text-xs text-gray-500">On Delivery</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-2xl font-bold text-gray-400">{stats.offline}</span>
        <span className="text-xs text-gray-500">Offline Today</span>
      </div>
    </div>
  </div>
);

export default RiderSummaryCard;
