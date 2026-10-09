import React from "react";
import { useZonesData } from "./delivery/useZonesData";
import { useZoneForm } from "./delivery/useZoneForm";
import { useTestDeliveryCheck } from "./delivery/useTestDeliveryCheck";
import ZoneCard from "./delivery/ZoneCard";
import ZoneFormCard from "./delivery/ZoneFormCard";
import TestDeliveryCheckCard from "./delivery/TestDeliveryCheckCard";

const DeliveryZonesPage: React.FC = () => {
  const { zones, loading, error, setError, successMsg, setSuccessMsg, fetchZones, handleToggleZone, handleDeleteZone } = useZonesData();
  const {
    showCreateForm,
    setShowCreateForm,
    editingZone,
    formData,
    setFormData,
    saving,
    handleChange,
    resetForm,
    handleCreateSubmit,
    handleEditSubmit,
    startEditing,
  } = useZoneForm(setError, setSuccessMsg, fetchZones);
  const {
    testAddress,
    setTestAddress,
    geocoding,
    geocodedLabel,
    setGeocodedLabel,
    geocodeResults,
    showAddressDropdown,
    setShowAddressDropdown,
    testResult,
    testing,
    pickGeoResult,
  } = useTestDeliveryCheck(setError);

  const activeZones = zones.filter((z) => z.isActive);
  const inactiveZones = zones.filter((z) => !z.isActive);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Delivery Zones</h1>
          <p className="text-gray-600 mt-1">
            Manage delivery areas, pricing by location, and where you deliver
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowCreateForm(true); }}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold flex items-center gap-2 shadow-sm"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Delivery Zone
        </button>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 flex items-center gap-2">
          <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {successMsg}
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex items-center gap-2">
          <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="text-sm text-gray-500 font-medium">Total Zones</div>
          <div className="text-3xl font-bold text-gray-900 mt-1">{zones.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-green-200 p-5">
          <div className="text-sm text-green-600 font-medium">Active (Delivering)</div>
          <div className="text-3xl font-bold text-green-700 mt-1">{activeZones.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-5">
          <div className="text-sm text-red-600 font-medium">Inactive (Paused)</div>
          <div className="text-3xl font-bold text-red-700 mt-1">{inactiveZones.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-5">
          <div className="text-sm text-blue-600 font-medium">Fee Range</div>
          <div className="text-3xl font-bold text-blue-700 mt-1">
            {zones.length > 0
              ? `GH₵${Math.min(...zones.map((z) => z.deliveryFee)).toFixed(0)} - ${Math.max(...zones.map((z) => z.deliveryFee)).toFixed(0)}`
              : "N/A"}
          </div>
        </div>
      </div>

      {/* Create / Edit Form */}
      {(showCreateForm || editingZone) && (
        <ZoneFormCard
          editingZone={editingZone}
          formData={formData}
          setFormData={setFormData}
          handleChange={handleChange}
          saving={saving}
          onSubmit={editingZone ? handleEditSubmit : handleCreateSubmit}
          onCancel={resetForm}
        />
      )}

      {/* Zones List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <svg className="animate-spin h-10 w-10 text-green-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : zones.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">🗺️</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No delivery zones yet</h3>
          <p className="text-gray-600 mb-6">
            Create your first delivery zone to start setting location-based delivery prices.
            Areas outside your zones won't receive deliveries.
          </p>
          <button
            onClick={() => { resetForm(); setShowCreateForm(true); }}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
          >
            Create First Zone
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Active Zones */}
          {activeZones.length > 0 && (
            <>
              <h3 className="text-lg font-bold text-green-700 flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                Active Zones ({activeZones.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeZones.map((zone) => (
                  <ZoneCard
                    key={zone.id}
                    zone={zone}
                    onEdit={startEditing}
                    onToggle={handleToggleZone}
                    onDelete={handleDeleteZone}
                  />
                ))}
              </div>
            </>
          )}

          {/* Inactive Zones */}
          {inactiveZones.length > 0 && (
            <>
              <h3 className="text-lg font-bold text-red-700 flex items-center gap-2 mt-6">
                <span className="w-3 h-3 bg-red-400 rounded-full"></span>
                Inactive Zones ({inactiveZones.length})
                <span className="text-sm font-normal text-gray-500">— Not delivering to these areas</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inactiveZones.map((zone) => (
                  <ZoneCard
                    key={zone.id}
                    zone={zone}
                    onEdit={startEditing}
                    onToggle={handleToggleZone}
                    onDelete={handleDeleteZone}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <TestDeliveryCheckCard
        testAddress={testAddress}
        setTestAddress={setTestAddress}
        setGeocodedLabel={setGeocodedLabel}
        geocoding={geocoding}
        geocodedLabel={geocodedLabel}
        geocodeResults={geocodeResults}
        showAddressDropdown={showAddressDropdown}
        setShowAddressDropdown={setShowAddressDropdown}
        pickGeoResult={pickGeoResult}
        testing={testing}
        testResult={testResult}
      />

      {/* How it works */}
      <div className="mt-10 bg-blue-50 rounded-lg border border-blue-200 p-6">
        <h3 className="text-lg font-bold text-blue-900 mb-3">How Delivery Zones Work</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
          <div>
            <div className="font-semibold mb-1">1. Zone = Circle on Map</div>
            <p>Each zone is defined by a center point (lat/lng) and a radius in km. Any address within that circle is covered.</p>
          </div>
          <div>
            <div className="font-semibold mb-1">2. Fee Per Zone</div>
            <p>Each zone has its own delivery fee. Customers are charged based on which zone their address falls in. If an address matches multiple zones, the cheapest fee applies.</p>
          </div>
          <div>
            <div className="font-semibold mb-1">3. No Zone = No Delivery</div>
            <p>If a customer's address is outside all active zones, checkout will show "delivery not available" and they won't be able to place an order.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryZonesPage;
