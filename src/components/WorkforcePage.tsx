import React, { useState } from "react";
import RidersTab from "./riders/RidersTab";
import PickersTab from "./workers/PickersTab";

// Riders and Pickers are the same kind of entity — someone the business
// assigns street-level work to and pays per task — that lived on two
// separate, differently-polished pages. This unifies the navigation only;
// Rider and Worker stay separate, differently-shaped data models.
const WorkforcePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"riders" | "pickers">("riders");

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
        </div>

        {activeTab === "riders" ? <RidersTab /> : <PickersTab />}
      </div>
    </div>
  );
};

export default WorkforcePage;
