import React from "react";
import type { ZoneLoad } from "./RiderTypes";

const ZoneLoadCard: React.FC<{ zones: ZoneLoad[] }> = ({ zones }) => (
  <div className="bg-white rounded-xl shadow p-6 mb-6">
    <h3 className="text-lg font-semibold mb-4">Zone Load</h3>
    <ul className="space-y-2">
      {zones.map(z => (
        <li key={z.zone} className="flex justify-between">
          <span className="font-medium text-gray-700">{z.zone}</span>
          <span className="text-xs px-2 py-1 rounded font-medium bg-blue-100 text-blue-700">{z.riders} riders / {z.deliveries} deliveries</span>
        </li>
      ))}
    </ul>
  </div>
);

export default ZoneLoadCard;
