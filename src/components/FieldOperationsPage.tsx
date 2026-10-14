import React, { useState } from "react";
import RidersTab from "./riders/RidersTab";
import PickersTab from "./workers/PickersTab";
import ZonesTab from "./workforce/ZonesTab";

// Riders, Pickers, and Zones — everyone and everything operating outside
// the building, in one place. Riders and Pickers are the same kind of
// entity (someone the business assigns street-level work to and pays per
// task); Zones is the geography/delivery-fee structure riders operate
// within, not a person, but belongs here rather than Warehouse (which is
// a stock/sourcing concern, unrelated to delivery). This unifies
// navigation only — Rider/Worker/Zone stay separate, differently-shaped
// data models.
const FieldOperationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"riders" | "pickers" | "zones">("riders");

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setActiveTab("riders")}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              activeTab === "riders" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Riders
          </button>
          <button
            onClick={() => setActiveTab("pickers")}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              activeTab === "pickers" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Pickers
          </button>
          <button
            onClick={() => setActiveTab("zones")}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              activeTab === "zones" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Delivery Zones
          </button>
        </div>

        {activeTab === "riders" && <RidersTab />}
        {activeTab === "pickers" && <PickersTab />}
        {activeTab === "zones" && <ZonesTab />}
      </div>
    </div>
  );
};

export default FieldOperationsPage;
