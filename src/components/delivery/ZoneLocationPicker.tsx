import React, { useState, useCallback, useRef } from 'react';
import { GoogleMap, Circle, Marker, useJsApiLoader } from '@react-google-maps/api';
import deliveryService from '../../services/deliveryService';

export interface ZoneLocationValue {
  lat: number;
  lng: number;
  radius: number; // km
}

interface Props {
  value: ZoneLocationValue;
  onChange: (value: ZoneLocationValue) => void;
}

const RADIUS_PRESETS = [
  { label: 'Nearby', km: 2 },
  { label: 'Standard', km: 5 },
  { label: 'Wide area', km: 10 },
];

const DEFAULT_CENTER = { lat: 5.6037, lng: -0.187 }; // Accra, shown only before a location is picked

const ZoneLocationPicker: React.FC<Props> = ({ value, onChange }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    id: 'dwom-admin-google-maps',
  });

  const [address, setAddress] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [resolvedLabel, setResolvedLabel] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);

  const circleRef = useRef<google.maps.Circle | null>(null);

  const hasLocation = value.lat !== 0 || value.lng !== 0;
  const center = hasLocation ? { lat: value.lat, lng: value.lng } : DEFAULT_CENTER;

  const pickResult = async (prediction: any) => {
    setSearching(true);
    setSearchResults([]);
    setSearchError(null);
    try {
      const details = await deliveryService.placeDetails(prediction.place_id);
      if (details.status === 'OK' && details.result) {
        const { lat, lng, formatted_address, name } = details.result;
        setResolvedLabel(formatted_address || name || prediction.description);
        onChange({ ...value, lat, lng });
      } else {
        setSearchError('Found the place but could not get its coordinates. Try another search.');
      }
    } catch {
      setSearchError('Failed to look up that location.');
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = async () => {
    if (!address.trim()) return;
    setSearching(true);
    setSearchError(null);
    setSearchResults([]);
    try {
      const data = await deliveryService.placesAutocomplete(address.trim());
      if (data.status !== 'OK' || !data.predictions?.length) {
        setSearchError(`Couldn't find "${address}". Try a more specific name or a nearby landmark.`);
        return;
      }
      if (data.predictions.length === 1) {
        await pickResult(data.predictions[0]);
      } else {
        setSearchResults(data.predictions);
        setSearching(false);
      }
    } catch {
      setSearchError('Failed to search — check your connection.');
      setSearching(false);
    }
  };

  // Circle's radius_changed/center_changed fire continuously while dragging,
  // not just on release — reading the live value off the ref (rather than
  // trusting event args, which this library doesn't pass) and pushing it
  // straight into onChange keeps the displayed km number and the map in
  // sync with the drag in real time.
  const handleRadiusChanged = useCallback(() => {
    if (circleRef.current) {
      const meters = circleRef.current.getRadius();
      onChange({ ...value, radius: Math.round((meters / 1000) * 10) / 10 });
    }
  }, [value, onChange]);

  const handleCenterChanged = useCallback(() => {
    if (circleRef.current) {
      const c = circleRef.current.getCenter();
      if (c) onChange({ ...value, lat: c.lat(), lng: c.lng() });
    }
  }, [value, onChange]);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Zone Center *</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch();
              }
            }}
            placeholder='e.g. "East Legon", "Accra Mall", "Tema Community 1"'
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={searching}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 whitespace-nowrap"
          >
            {searching ? 'Searching…' : 'Search'}
          </button>
        </div>

        {resolvedLabel && (
          <div className="mt-2 text-xs text-gray-600 bg-gray-50 rounded px-3 py-2">📍 {resolvedLabel}</div>
        )}
        {!resolvedLabel && hasLocation && (
          <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded px-3 py-2">
            Current center: {value.lat.toFixed(4)}, {value.lng.toFixed(4)} — search above to change it, or drag the pin on the map below.
          </div>
        )}
        {searchError && <div className="mt-2 text-xs text-red-600">{searchError}</div>}
        {searchResults.length > 0 && (
          <div className="mt-2 border border-blue-200 rounded-lg overflow-hidden">
            <div className="px-3 py-2 bg-blue-50 text-xs font-semibold text-blue-700">Multiple matches — pick one:</div>
            {searchResults.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => pickResult(p)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 border-t border-blue-100"
              >
                <span className="font-medium text-gray-900">{p.main_text}</span>
                {p.secondary_text && <span className="text-gray-500 ml-1 text-xs">{p.secondary_text}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">Delivery Radius</label>
          <span className="text-sm font-semibold text-gray-900">{value.radius || 0} km</span>
        </div>
        <input
          type="range"
          min={0.5}
          max={20}
          step={0.5}
          value={value.radius || 0.5}
          onChange={(e) => onChange({ ...value, radius: parseFloat(e.target.value) })}
          className="w-full accent-green-600"
        />
        <div className="flex gap-2 mt-2">
          {RADIUS_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => onChange({ ...value, radius: preset.km })}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                value.radius === preset.km
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {preset.label} ({preset.km}km)
            </button>
          ))}
        </div>
      </div>

      {loadError && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Map preview isn't available right now, but the search and radius controls above work normally without it.
        </div>
      )}

      {isLoaded && !hasLocation && (
        <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          Search for a location above to see it on the map.
        </div>
      )}

      {isLoaded && hasLocation && (
        <div className="rounded-lg overflow-hidden border border-gray-300">
          <GoogleMap
            center={center}
            zoom={12}
            mapContainerStyle={{ width: '100%', height: '320px' }}
            options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
          >
            <Marker position={center} />
            <Circle
              center={center}
              radius={(value.radius || 0.5) * 1000}
              onLoad={(circle) => {
                circleRef.current = circle;
              }}
              onRadiusChanged={handleRadiusChanged}
              onCenterChanged={handleCenterChanged}
              editable
              draggable
              options={{
                fillColor: '#16a34a',
                fillOpacity: 0.15,
                strokeColor: '#16a34a',
                strokeWeight: 2,
              }}
            />
          </GoogleMap>
          <p className="text-xs text-gray-500 bg-gray-50 px-3 py-2 border-t border-gray-200">
            Drag the circle's edge to resize it, or drag the circle itself to reposition it.
          </p>
        </div>
      )}
    </div>
  );
};

export default ZoneLocationPicker;
