import React from "react";
import CreateRiderModal from "./CreateRiderModal";
import AssignZoneModal from "./AssignZoneModal";
import RiderDetailsModal from "./RiderDetailsModal";
import ZoneManagementModal from "./ZoneManagementModal";
import { useRidersData } from "./useRidersData";
import { useRidersFilters } from "./useRidersFilters";
import { useRiderModals } from "./useRiderModals";
import RidersHeader from "./RidersHeader";
import RidersStatsCards from "./RidersStatsCards";
import RidersFilterBar from "./RidersFilterBar";
import RidersTable from "./RidersTable";

// Split out of the former standalone RidersPage — now a tab on the
// unified Workforce page, alongside Pickers.
const RidersTab: React.FC = () => {
  const { riders, zones, loading, error, fetchData, handleStatusChange, handleDeactivate, handleReactivate } = useRidersData();
  const { searchQuery, setSearchQuery, sortBy, setSortBy, filterStatus, setFilterStatus, filteredRiders } = useRidersFilters(riders);
  const {
    isCreateRiderModalOpen,
    setIsCreateRiderModalOpen,
    isAssignZoneModalOpen,
    setIsAssignZoneModalOpen,
    selectedRiderForZone,
    isRiderDetailsOpen,
    setIsRiderDetailsOpen,
    selectedRiderForDetails,
    isZoneManagementOpen,
    setIsZoneManagementOpen,
    handleViewDetails,
    handleCreateRider,
    handleAssignZone,
    handleModalSuccess,
  } = useRiderModals(fetchData);

  return (
    <>
      <RidersHeader onManageZones={() => setIsZoneManagementOpen(true)} onCreateRider={handleCreateRider} />

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
          <RidersStatsCards riders={riders} />

          {/* Riders Table */}
          <section className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-bold mb-4">Riders List</h2>

            <RidersFilterBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              sortBy={sortBy}
              setSortBy={setSortBy}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
            />

            <RidersTable
              filteredRiders={filteredRiders}
              onViewDetails={handleViewDetails}
              onStatusChange={handleStatusChange}
              onAssignZone={handleAssignZone}
              onDeactivate={handleDeactivate}
              onReactivate={handleReactivate}
            />
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
    </>
  );
};

export default RidersTab;
