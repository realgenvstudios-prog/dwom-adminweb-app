import React from "react";
import type { Rider } from "./RiderTypes";

interface RidersTableProps {
  riders: Rider[];
  onRowClick: (rider: Rider) => void;
}

const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase();

const RidersTable: React.FC<RidersTableProps> = ({ riders, onRowClick }) => (
  <div className="bg-white rounded-xl shadow border border-gray-100 overflow-x-auto">
    <table className="min-w-full text-sm">
      <thead>
        <tr className="bg-gray-50">
          <th className="px-4 py-3 text-left">Rider</th>
          <th className="px-4 py-3 text-left">Phone</th>
          <th className="px-4 py-3 text-left">Zone</th>
          <th className="px-4 py-3 text-left">Vehicle</th>
          <th className="px-4 py-3 text-left">Status</th>
          <th className="px-4 py-3 text-left">Deliveries</th>
          <th className="px-4 py-3 text-left">Earnings (GHS)</th>
          <th className="px-4 py-3 text-left">Rating</th>
          <th className="px-4 py-3 text-left">Actions</th>
        </tr>
      </thead>
      <tbody>
        {riders.map(rider => (
          <tr key={rider.id} className="border-t hover:bg-gray-50 cursor-pointer" onClick={() => onRowClick(rider)}>
            <td className="px-4 py-3 flex items-center gap-2">
              <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">{getInitials(rider.name)}</span>
              <span className="font-semibold text-gray-900">{rider.name}</span>
            </td>
            <td className="px-4 py-3">{rider.phone}</td>
            <td className="px-4 py-3">{rider.zone}</td>
            <td className="px-4 py-3">{rider.vehicleType}</td>
            <td className="px-4 py-3">
              <span className={`px-2 py-1 rounded text-xs font-semibold ${rider.status === "Online" ? "bg-green-100 text-green-700" : rider.status === "On Delivery" ? "bg-yellow-100 text-yellow-700" : "bg-gray-200 text-gray-600"}`}>{rider.status}</span>
            </td>
            <td className="px-4 py-3">{rider.deliveriesToday}</td>
            <td className="px-4 py-3">GHS {rider.earningsToday.toFixed(2)}</td>
            <td className="px-4 py-3">{rider.rating.toFixed(1)}</td>
            <td className="px-4 py-3">
              <button className="text-blue-600 hover:underline text-xs" onClick={e => { e.stopPropagation(); onRowClick(rider); }}>View</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default RidersTable;
