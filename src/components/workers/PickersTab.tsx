import React, { useState, useEffect, useCallback } from "react";
import workersService, { type Worker, type Trip } from "../../services/workersService";
import CreatePickerModal from "./CreatePickerModal";
import PickersHeader from "./PickersHeader";
import { logger } from "../../utils/logger";

// Split out of the former standalone WorkersPage — now a tab on the
// unified Workforce page, alongside Riders. Picker creation now mirrors
// Riders' header-button + modal pattern instead of a buried inline form.
const PickersTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<"trips" | "workers">("workers");
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loadingWorkers, setLoadingWorkers] = useState(false);

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(false);

  const loadWorkers = useCallback(async () => {
    try {
      setLoadingWorkers(true);
      setWorkers(await workersService.getAll());
    } catch (err) {
      logger.error("Failed to load workers:", err);
    } finally {
      setLoadingWorkers(false);
    }
  }, []);

  const loadTrips = useCallback(async () => {
    try {
      setLoadingTrips(true);
      setTrips(await workersService.getTrips());
    } catch (err) {
      logger.error("Failed to load trips:", err);
    } finally {
      setLoadingTrips(false);
    }
  }, []);

  useEffect(() => {
    loadWorkers();
    loadTrips();
  }, [loadWorkers, loadTrips]);

  const handleToggleActive = async (worker: Worker) => {
    try {
      await workersService.update(worker.id, { active: !worker.active });
      await loadWorkers();
    } catch (err) {
      logger.error("Failed to update worker:", err);
    }
  };

  const handleDeleteTrip = async (id: number) => {
    if (!window.confirm("Remove this order from the picker's trip? This rebalances their pay for that day.")) return;
    try {
      await workersService.deleteTrip(id);
      await loadTrips();
    } catch (err) {
      logger.error("Failed to delete trip:", err);
    }
  };

  return (
    <>
      <PickersHeader onCreatePicker={() => setCreateModalOpen(true)} activeCount={workers.filter((w) => w.active).length} />

      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setActiveSubTab("workers")}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            activeSubTab === "workers" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Roster ({workers.length})
        </button>
        <button
          onClick={() => setActiveSubTab("trips")}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            activeSubTab === "trips" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Trip History
        </button>
      </div>

      {activeSubTab === "workers" ? (
        <div className="bg-white shadow-xs rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4">Roster</h2>
          {loadingWorkers ? (
            <p className="text-gray-500 text-sm py-8 text-center">Loading...</p>
          ) : workers.length === 0 ? (
            <p className="text-gray-500 text-sm py-8 text-center">No pickers added yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2 pr-4">Phone</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {workers.map((w) => (
                    <tr key={w.id} className="border-b border-gray-50">
                      <td className="py-2 pr-4 font-medium">{w.name}</td>
                      <td className="py-2 pr-4 capitalize">{w.type}</td>
                      <td className="py-2 pr-4">{w.phone || "—"}</td>
                      <td className="py-2 pr-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${w.active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {w.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-2 text-right">
                        <button onClick={() => handleToggleActive(w)} className="text-blue-600 hover:text-blue-800 text-xs">
                          {w.active ? "Deactivate" : "Reactivate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white shadow-xs rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4">Trip history</h2>
          {loadingTrips ? (
            <p className="text-gray-500 text-sm py-8 text-center">Loading...</p>
          ) : trips.length === 0 ? (
            <p className="text-gray-500 text-sm py-8 text-center">
              No trips yet — assign a picker to an order to create one.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Worker</th>
                    <th className="py-2 pr-4">This trip's pay</th>
                    <th className="py-2 pr-4">Orders</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {trips.map((t) => (
                    <tr key={t.id} className="border-b border-gray-50">
                      <td className="py-2 pr-4">{new Date(t.date).toISOString().split("T")[0]}</td>
                      <td className="py-2 pr-4">{t.Worker?.name}</td>
                      <td className="py-2 pr-4 font-medium">GHS {t.totalCost.toLocaleString()}</td>
                      <td className="py-2 pr-4 text-gray-500">{t.TripOrder.map((o) => `#${o.orderId}`).join(", ")}</td>
                      <td className="py-2 text-right">
                        <button onClick={() => handleDeleteTrip(t.id)} className="text-red-500 hover:text-red-700 text-xs">
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <CreatePickerModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={loadWorkers}
      />
    </>
  );
};

export default PickersTab;
