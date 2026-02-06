import React, { useState, useEffect } from "react";
import ridersService from "../../services/ridersService";
import type { RiderData, Zone } from "../../services/ridersService";
import CreateRiderModal from "./CreateRiderModal";
import AssignZoneModal from "./AssignZoneModal";
import RiderDetailsModal from "./RiderDetailsModal";
import ZoneManagementModal from "./ZoneManagementModal";

const RidersPage: React.FC = () => {
  const [riders, setRiders] = useState<RiderData[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isCreateRiderModalOpen, setIsCreateRiderModalOpen] = useState(false);
  const [isAssignZoneModalOpen, setIsAssignZoneModalOpen] = useState(false);
  const [selectedRiderForZone, setSelectedRiderForZone] = useState<RiderData | null>(null);
  const [isRiderDetailsOpen, setIsRiderDetailsOpen] = useState(false);
  const [selectedRiderForDetails, setSelectedRiderForDetails] = useState<RiderData | null>(null);
  const [isZoneManagementOpen, setIsZoneManagementOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("🚴 [RidersPage] Fetching riders and zones");

      const [ridersData, zonesData] = await Promise.all([
        ridersService.getAllRiders(),
        ridersService.getAllZones(),
      ]);

      console.log("✅ [RidersPage] Data loaded");
      setRiders(ridersData || []);
      setZones(zonesData || []);
    } catch (err: any) {
      console.error("❌ [RidersPage] Failed to fetch data:", err);
      setError(err.message || "Failed to load riders data");
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort riders
  const filteredRiders = riders
    .filter((rider) => {
      const matchesSearch =
        rider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rider.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rider.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        filterStatus === "all"
          ? true
          : filterStatus === "active"
          ? rider.isActive
          : !rider.isActive;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "earnings":
          return b.totalEarnings - a.totalEarnings;
        case "rating":
          return b.rating - a.rating;
        case "deliveries":
          return b.totalDeliveries - a.totalDeliveries;
        case "status":
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-700";
      case "on_delivery":
        return "bg-blue-100 text-blue-700";
      case "busy":
        return "bg-yellow-100 text-yellow-700";
      case "offline":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const handleStatusChange = async (rider: RiderData, newStatus: string) => {
    try {
      await ridersService.updateRiderStatus(rider.id, newStatus);
      setRiders(
        riders.map((r) =>
          r.id === rider.id ? { ...r, status: newStatus as any } : r
        )
      );
    } catch (err: any) {
      console.error("Failed to update status:", err);
      alert("Failed to update rider status");
    }
  };

  const handleDeactivate = async (rider: RiderData) => {
    if (
      !window.confirm(`Are you sure you want to deactivate ${rider.name}?`)
    ) {
      return;
    }

    try {
      await ridersService.deactivateRider(rider.id);
      setRiders(
        riders.map((r) =>
          r.id === rider.id ? { ...r, isActive: false, status: "offline" } : r
        )
      );
    } catch (err: any) {
      console.error("Failed to deactivate rider:", err);
      alert("Failed to deactivate rider");
    }
  };

  const handleReactivate = async (rider: RiderData) => {
    if (
      !window.confirm(`Are you sure you want to reactivate ${rider.name}?`)
    ) {
      return;
    }

    try {
      await ridersService.reactivateRider(rider.id);
      setRiders(
        riders.map((r) =>
          r.id === rider.id ? { ...r, isActive: true, status: "available" } : r
        )
      );
    } catch (err: any) {
      console.error("Failed to reactivate rider:", err);
      alert("Failed to reactivate rider");
    }
  };

  const handleViewDetails = (rider: RiderData) => {
    setSelectedRiderForDetails(rider);
    setIsRiderDetailsOpen(true);
  };

  const handleCreateRider = () => {
    setIsCreateRiderModalOpen(true);
  };

  const handleAssignZone = (rider: RiderData) => {
    setSelectedRiderForZone(rider);
    setIsAssignZoneModalOpen(true);
  };

  const handleModalSuccess = () => {
    fetchData();
  };

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Riders Management</h1>
            <p className="text-gray-600 mt-1">Manage delivery riders and track performance</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsZoneManagementOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.3A4.5 4.5 0 1113.5 13H11V9.413l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13H5.5z" />
              </svg>
              Manage Zones
            </button>
            <button
              onClick={handleCreateRider}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Rider
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <svg
              className="animate-spin h-8 w-8 text-blue-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <p className="ml-3 text-gray-600">Loading riders data...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-lg bg-red-50 text-red-700 mb-6">{error}</div>
        ) : (
          <>
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

            {/* Riders Table */}
            <section className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-bold mb-4">Riders List</h2>

              <div className="flex flex-wrap gap-4 mb-6">
                <input
                  type="text"
                  placeholder="Search by name, phone, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 min-w-[200px] border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="name">Sort by Name</option>
                  <option value="earnings">Sort by Earnings</option>
                  <option value="rating">Sort by Rating</option>
                  <option value="deliveries">Sort by Deliveries</option>
                  <option value="status">Sort by Status</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Riders</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>

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
                        <tr key={rider.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => handleViewDetails(rider)}>
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
                                handleStatusChange(rider, e.target.value)
                              }
                              disabled={!rider.isActive}
                              onClick={(e) => e.stopPropagation()}
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
                                    onClick={(e) => {e.stopPropagation(); handleAssignZone(rider);}}
                                    className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                                    title="Assign to zone"
                                  >
                                    Zone
                                  </button>
                                  <button
                                    onClick={(e) => {e.stopPropagation(); handleDeactivate(rider);}}
                                    className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                                    title="Deactivate rider"
                                  >
                                    Deactivate
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={(e) => {e.stopPropagation(); handleReactivate(rider);}}
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
            </section>
          </>
        )}

        {/* Create Rider Modal */}
        <CreateRiderModal
          isOpen={isCreateRiderModalOpen}
          onClose={() => setIsCreateRiderModalOpen(false)}
          onSuccess={handleModalSuccess}
        />

        {/* Assign Zone Modal */}
        <AssignZoneModal
          isOpen={isAssignZoneModalOpen}
          onClose={() => setIsAssignZoneModalOpen(false)}
          rider={selectedRiderForZone}
          zones={zones}
          onSuccess={handleModalSuccess}
        />

        {/* Rider Details Modal */}
        <RiderDetailsModal
          isOpen={isRiderDetailsOpen}
          onClose={() => setIsRiderDetailsOpen(false)}
          rider={selectedRiderForDetails}
        />

        {/* Zone Management Modal */}
        <ZoneManagementModal
          isOpen={isZoneManagementOpen}
          onClose={() => setIsZoneManagementOpen(false)}
          onSuccess={handleModalSuccess}
        />
      </div>
    </div>
  );
};

export default RidersPage;
