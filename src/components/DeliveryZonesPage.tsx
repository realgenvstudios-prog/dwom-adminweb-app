import React, { useState, useEffect, useRef } from "react";
import deliveryService from "../services/deliveryService";
import type { DeliveryZone } from "../services/deliveryService";
import ridersService from "../services/ridersService";
import ZoneLocationPicker from "./delivery/ZoneLocationPicker";

const DeliveryZonesPage: React.FC = () => {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    lat: "",
    lng: "",
    radius: "",
    deliveryFee: "",
  });
  const [saving, setSaving] = useState(false);

  // Test delivery check
  const [testLat, setTestLat] = useState("");
  const [testLng, setTestLng] = useState("");
  const [testAddress, setTestAddress] = useState("");
  const [geocoding, setGeocoding] = useState(false);
  const [geocodedLabel, setGeocodedLabel] = useState("");
  const [geocodeResults, setGeocodeResults] = useState<any[]>([]);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const addressDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addressLatestQueryRef = useRef("");

  useEffect(() => {
    fetchZones();
  }, []);

  // Auto-dismiss messages
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const fetchZones = async () => {
    try {
      setLoading(true);
      const data = await deliveryService.getAllZones();
      setZones(data);
    } catch (err: any) {
      setError("Failed to load delivery zones");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    // Radius defaults to the "Standard" preset so the slider's displayed
    // value always matches real form state — otherwise a new zone could
    // look like 5km is already chosen when nothing's actually been set yet.
    setFormData({ name: "", lat: "", lng: "", radius: "5", deliveryFee: "" });
    setShowCreateForm(false);
    setEditingZone(null);
    setError(null);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.lat || !formData.lng || !formData.radius || !formData.deliveryFee) {
      setError("Please fill in all required fields including delivery fee");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await ridersService.createZone({
        name: formData.name,
        lat: parseFloat(formData.lat),
        lng: parseFloat(formData.lng),
        radius: parseFloat(formData.radius),
        deliveryFee: parseFloat(formData.deliveryFee),
      });

      setSuccessMsg(`Zone "${formData.name}" created successfully!`);
      resetForm();
      fetchZones();
    } catch (err: any) {
      setError(err.message || "Failed to create zone");
    } finally {
      setSaving(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingZone) return;

    try {
      setSaving(true);
      setError(null);

      await deliveryService.updateZone(editingZone.id, {
        name: formData.name || undefined,
        lat: formData.lat ? parseFloat(formData.lat) : undefined,
        lng: formData.lng ? parseFloat(formData.lng) : undefined,
        radius: formData.radius ? parseFloat(formData.radius) : undefined,
        deliveryFee: formData.deliveryFee ? parseFloat(formData.deliveryFee) : undefined,
      });

      setSuccessMsg(`Zone "${formData.name}" updated successfully!`);
      resetForm();
      fetchZones();
    } catch (err: any) {
      setError(err.message || "Failed to update zone");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleZone = async (zone: DeliveryZone) => {
    try {
      await deliveryService.toggleZone(zone.id);
      setSuccessMsg(`Zone "${zone.name}" ${zone.isActive ? "disabled" : "enabled"} successfully!`);
      fetchZones();
    } catch (err: any) {
      setError(err.message || "Failed to toggle zone");
    }
  };

  const handleDeleteZone = async (zone: DeliveryZone) => {
    if (!window.confirm(`Are you sure you want to delete zone "${zone.name}"? This cannot be undone.`)) {
      return;
    }

    try {
      await deliveryService.deleteZone(zone.id);
      setSuccessMsg(`Zone "${zone.name}" deleted successfully!`);
      fetchZones();
    } catch (err: any) {
      setError(err.message || "Failed to delete zone");
    }
  };

  const startEditing = (zone: DeliveryZone) => {
    setEditingZone(zone);
    setShowCreateForm(false);
    setFormData({
      name: zone.name,
      lat: zone.lat.toString(),
      lng: zone.lng.toString(),
      radius: zone.radius.toString(),
      deliveryFee: zone.deliveryFee.toString(),
    });
  };

  const handleTestDelivery = async () => {
    if (!testLat || !testLng) {
      setError("Enter an address or coordinates to test");
      return;
    }

    try {
      setTesting(true);
      setTestResult(null);
      const result = await deliveryService.checkDelivery(parseFloat(testLat), parseFloat(testLng));
      setTestResult(result);
    } catch (err: any) {
      setError("Failed to check delivery");
    } finally {
      setTesting(false);
    }
  };

  // Live, as-you-type suggestions — mirrors ZoneLocationPicker's address
  // search. Only fetches predictions here; resolving a pick (place details +
  // the actual delivery check) happens in pickGeoResult below.
  useEffect(() => {
    if (addressDebounceRef.current) clearTimeout(addressDebounceRef.current);

    const query = testAddress.trim();
    if (query.length < 3 || query === geocodedLabel) {
      setGeocodeResults([]);
      setShowAddressDropdown(false);
      return;
    }

    addressDebounceRef.current = setTimeout(async () => {
      addressLatestQueryRef.current = query;
      setGeocoding(true);
      try {
        const data = await deliveryService.placesAutocomplete(query);
        if (addressLatestQueryRef.current !== query) return; // superseded by a newer keystroke
        if (data.status === "OK" && data.predictions?.length) {
          setGeocodeResults(data.predictions);
          setShowAddressDropdown(true);
        } else {
          setGeocodeResults([]);
          setError(
            `Could not find "${query}". Tips:\n• Try a more specific name, e.g., "${query}, East Legon"\n• Use a nearby known place like "East Legon" or "Accra Mall"\n• Or enter coordinates directly below`
          );
        }
      } catch {
        if (addressLatestQueryRef.current === query) {
          setError("Failed to look up address. Check your internet connection.");
        }
      } finally {
        if (addressLatestQueryRef.current === query) setGeocoding(false);
      }
    }, 350);

    return () => {
      if (addressDebounceRef.current) clearTimeout(addressDebounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testAddress]);

  const pickGeoResult = async (place: any) => {
    setShowAddressDropdown(false);
    setGeocodeResults([]);
    try {
      setTesting(true);
      setTestResult(null);

      // Fetch place details via backend proxy
      const details = await deliveryService.placeDetails(place.place_id);

      if (details.status === "OK" && details.result) {
        const { lat, lng, formatted_address, name } = details.result;
        const label = formatted_address || name || place.description;
        setTestLat(lat.toFixed(4));
        setTestLng(lng.toFixed(4));
        setGeocodedLabel(label);
        setTestAddress(label);

        const result = await deliveryService.checkDelivery(lat, lng);
        setTestResult(result);
      } else {
        setError("Could not get coordinates for this place. Try another option.");
      }
    } catch {
      setError("Failed to check delivery");
    } finally {
      setTesting(false);
    }
  };

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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">
            {editingZone ? `Edit Zone: ${editingZone.name}` : "Create New Delivery Zone"}
          </h2>
          <form onSubmit={editingZone ? handleEditSubmit : handleCreateSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Zone Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Accra Central, East Legon, Tema"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <ZoneLocationPicker
                  value={{
                    lat: parseFloat(formData.lat) || 0,
                    lng: parseFloat(formData.lng) || 0,
                    radius: parseFloat(formData.radius) || 0,
                  }}
                  onChange={(v) =>
                    setFormData((prev) => ({
                      ...prev,
                      lat: v.lat.toString(),
                      lng: v.lng.toString(),
                      radius: v.radius.toString(),
                    }))
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Fee (GH₵) *</label>
                <input
                  type="number"
                  step="0.50"
                  min="0"
                  name="deliveryFee"
                  value={formData.deliveryFee}
                  onChange={handleChange}
                  placeholder="e.g., 8.00"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Price charged to customer for delivery in this zone</p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {editingZone ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  editingZone ? "Update Zone" : "Create Zone"
                )}
              </button>
            </div>
          </form>
        </div>
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

      {/* Test Delivery Check */}
      <div className="mt-10 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-1">Test Delivery Check</h3>
        <p className="text-sm text-gray-600 mb-4">
          Search by address/landmark or enter coordinates to check if a location falls within a delivery zone.
        </p>

        {/* Address / Landmark Search */}
        <div className="mb-4 relative">
          <label className="block text-xs font-medium text-gray-600 mb-1">Search by Address or Landmark</label>
          <div className="relative">
            <input
              type="text"
              value={testAddress}
              onChange={(e) => {
                setTestAddress(e.target.value);
                setGeocodedLabel("");
              }}
              onFocus={() => {
                if (geocodeResults.length > 0) setShowAddressDropdown(true);
              }}
              onBlur={() => {
                // Delay so a click on a suggestion (onMouseDown fires first) still registers.
                setTimeout(() => setShowAddressDropdown(false), 150);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && showAddressDropdown && geocodeResults.length > 0) {
                  e.preventDefault();
                  pickGeoResult(geocodeResults[0]);
                } else if (e.key === "Escape") {
                  setShowAddressDropdown(false);
                }
              }}
              placeholder='Start typing… e.g. "East Legon", "Accra Mall"'
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {geocoding && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Searching…</span>
            )}

            {showAddressDropdown && geocodeResults.length > 0 && (
              <div className="absolute z-10 mt-1 w-full border border-gray-200 bg-white rounded-lg shadow-lg overflow-hidden">
                {geocodeResults.map((place, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault(); // keep focus/avoid blur racing the click
                      pickGeoResult(place);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 border-t border-gray-100 first:border-t-0"
                  >
                    <span className="font-medium text-gray-900">{place.main_text}</span>
                    {place.secondary_text && (
                      <span className="text-gray-500 ml-1 text-xs">{place.secondary_text}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          {geocodedLabel && (
            <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded px-3 py-2">
              📍 Found: {geocodedLabel}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 border-t border-gray-200"></div>
          <span className="text-xs text-gray-400 font-medium">OR use coordinates</span>
          <div className="flex-1 border-t border-gray-200"></div>
        </div>

        {/* Manual Coordinates */}
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Latitude</label>
            <input
              type="number"
              step="0.0001"
              value={testLat}
              onChange={(e) => setTestLat(e.target.value)}
              placeholder="5.6037"
              className="w-40 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Longitude</label>
            <input
              type="number"
              step="0.0001"
              value={testLng}
              onChange={(e) => setTestLng(e.target.value)}
              placeholder="-0.1870"
              className="w-40 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleTestDelivery}
            disabled={testing || geocoding}
            className="px-5 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            {testing ? "Checking..." : "Check Coordinates"}
          </button>
        </div>

        {testResult && (
          <div className={`mt-4 p-4 rounded-lg border ${testResult.deliverable ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
            <div className={`font-semibold ${testResult.deliverable ? "text-green-800" : "text-red-800"}`}>
              {testResult.deliverable ? "✅ Delivery Available" : "❌ Not Deliverable"}
            </div>
            <div className="text-sm mt-1 text-gray-700">{testResult.message}</div>
            {testResult.deliverable && (
              <div className="text-sm mt-1 text-gray-700">
                Delivery Fee: <span className="font-bold">GH₵{testResult.deliveryFee?.toFixed(2)}</span>
                {testResult.zone && <span className="ml-2 text-gray-500">(Zone: {testResult.zone.name})</span>}
              </div>
            )}
          </div>
        )}
      </div>

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

/* Zone Card Component */
const ZoneCard: React.FC<{
  zone: DeliveryZone;
  onEdit: (zone: DeliveryZone) => void;
  onToggle: (zone: DeliveryZone) => void;
  onDelete: (zone: DeliveryZone) => void;
}> = ({ zone, onEdit, onToggle, onDelete }) => {
  const riderCount = zone.Rider?.length || 0;

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-5 transition hover:shadow-md ${zone.isActive ? "border-green-200" : "border-gray-300 opacity-75"}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-bold text-gray-900 text-lg">{zone.name}</h4>
          {zone.description && <p className="text-sm text-gray-500 mt-0.5">{zone.description}</p>}
        </div>
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${zone.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {zone.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
        <div>
          <span className="text-gray-500">Delivery Fee</span>
          <div className="font-bold text-lg text-gray-900">GH₵{zone.deliveryFee.toFixed(2)}</div>
        </div>
        <div>
          <span className="text-gray-500">Radius</span>
          <div className="font-bold text-gray-900">{zone.radius} km</div>
        </div>
        <div>
          <span className="text-gray-500">Center</span>
          <div className="font-mono text-xs text-gray-700">{zone.lat.toFixed(4)}, {zone.lng.toFixed(4)}</div>
        </div>
        <div>
          <span className="text-gray-500">Riders</span>
          <div className="font-bold text-gray-900">{riderCount}</div>
        </div>
      </div>

      <div className="flex gap-2 border-t border-gray-100 pt-3">
        <button
          onClick={() => onEdit(zone)}
          className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
        >
          Edit
        </button>
        <button
          onClick={() => onToggle(zone)}
          className={`flex-1 px-3 py-1.5 text-sm rounded-lg ${zone.isActive ? "bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100" : "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"}`}
        >
          {zone.isActive ? "Disable" : "Enable"}
        </button>
        <button
          onClick={() => onDelete(zone)}
          className="px-3 py-1.5 text-sm bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default DeliveryZonesPage;
