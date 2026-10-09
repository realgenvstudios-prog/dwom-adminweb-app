interface TestDeliveryCheckCardProps {
  testAddress: string;
  setTestAddress: (value: string) => void;
  setGeocodedLabel: (label: string) => void;
  geocoding: boolean;
  geocodedLabel: string;
  geocodeResults: any[];
  showAddressDropdown: boolean;
  setShowAddressDropdown: (open: boolean) => void;
  pickGeoResult: (place: any) => void;
  testing: boolean;
  testResult: any;
}

// The "Test Delivery Check" card: address/landmark search with live
// autocomplete, and the resulting deliverability check. Split out of the
// former monolithic DeliveryZonesPage.
export default function TestDeliveryCheckCard({
  testAddress,
  setTestAddress,
  setGeocodedLabel,
  geocoding,
  geocodedLabel,
  geocodeResults,
  showAddressDropdown,
  setShowAddressDropdown,
  pickGeoResult,
  testing,
  testResult,
}: TestDeliveryCheckCardProps) {
  return (
    <div className="mt-10 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-1">Test Delivery Check</h3>
      <p className="text-sm text-gray-600 mb-4">
        Search by address or landmark to check if a location falls within a delivery zone.
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

      {testing && !testResult && (
        <div className="mt-4 text-sm text-gray-500">Checking…</div>
      )}

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
  );
}
