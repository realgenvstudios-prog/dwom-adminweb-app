import React, { useState, useEffect, useCallback } from "react";
import workersService, { type Worker, type Trip } from "../services/workersService";
import { logger } from "../utils/logger";

const emptyWorkerForm = { name: "", phone: "", type: "kayayie" };

const WorkersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"trips" | "workers">("trips");

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loadingWorkers, setLoadingWorkers] = useState(false);
  const [workerForm, setWorkerForm] = useState(emptyWorkerForm);
  const [savingWorker, setSavingWorker] = useState(false);
  const [workerError, setWorkerError] = useState<string | null>(null);

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

  const handleSaveWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerForm.name.trim()) {
      setWorkerError("Name is required");
      return;
    }
    try {
      setSavingWorker(true);
      setWorkerError(null);
      await workersService.create({
        name: workerForm.name,
        phone: workerForm.phone || undefined,
        type: workerForm.type,
      });
      setWorkerForm(emptyWorkerForm);
      await loadWorkers();
    } catch (err) {
      logger.error("Failed to save worker:", err);
      setWorkerError("Failed to save worker");
    } finally {
      setSavingWorker(false);
    }
  };

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
    <div className="bg-gray-50 min-h-screen py-10 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Workers & Trips</h1>
          <p className="text-gray-600 mt-1">
            Kayayie/picker roster. Trips are created automatically when you assign a picker to an order — same as assigning a rider,
            right there on the order itself. Pay is computed per worker per day; configure the rates on the Finance page's Settings tab.
          </p>
        </div>

        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setActiveTab("trips")}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              activeTab === "trips" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Trip History
          </button>
          <button
            onClick={() => setActiveTab("workers")}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              activeTab === "workers" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Workers ({workers.length})
          </button>
        </div>

        {activeTab === "trips" ? (
          <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-6">
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
                        <td className="py-2 pr-4 text-gray-500">
                          {t.TripOrder.map((o) => `#${o.orderId}`).join(", ")}
                        </td>
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
        ) : (
          <>
            <form onSubmit={handleSaveWorker} className="bg-white shadow-sm rounded-xl border border-gray-100 p-6 mb-8">
              <h2 className="text-lg font-semibold mb-4">Add a worker</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Name</label>
                  <input
                    type="text"
                    value={workerForm.name}
                    onChange={(e) => setWorkerForm({ ...workerForm, name: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Phone</label>
                  <input
                    type="text"
                    value={workerForm.phone}
                    onChange={(e) => setWorkerForm({ ...workerForm, phone: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Type</label>
                  <select
                    value={workerForm.type}
                    onChange={(e) => setWorkerForm({ ...workerForm, type: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2"
                  >
                    <option value="kayayie">Kayayie</option>
                    <option value="picker">Picker</option>
                  </select>
                </div>
              </div>
              {workerError && <p className="text-red-600 text-sm mt-3">⚠️ {workerError}</p>}
              <button
                type="submit"
                disabled={savingWorker}
                className="mt-4 bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold disabled:opacity-50"
              >
                {savingWorker ? "Saving..." : "Add Worker"}
              </button>
            </form>

            <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-6">
              <h2 className="text-lg font-semibold mb-4">Roster</h2>
              {loadingWorkers ? (
                <p className="text-gray-500 text-sm py-8 text-center">Loading...</p>
              ) : workers.length === 0 ? (
                <p className="text-gray-500 text-sm py-8 text-center">No workers added yet.</p>
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
          </>
        )}
      </div>
    </div>
  );
};

export default WorkersPage;
