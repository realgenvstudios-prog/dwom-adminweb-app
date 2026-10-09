import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
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
  const [showDropdown, setShowDropdown] = useState(false);
  const [resolvedLabel, setResolvedLabel] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);

  const circleRef = useRef<google.maps.Circle | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestQueryRef = useRef('');

  const hasLocation = value.lat !== 0 || value.lng !== 0;
  // Memoized so the object reference is stable across renders where lat/lng
  // haven't actually changed — @react-google-maps/api's Circle diffs this
  // prop by reference and calls setCenter() on the native circle whenever
  // it changes identity, so a fresh literal every render (even from
  // unrelated state updates) forces redundant setCenter() calls. During an
  // active drag those externally-forced resets fight with Google's own
  // drag handling and re-fire center_changed, which re-triggers onChange
  // and loops until React throws "Maximum update depth exceeded" (#185).
  const center = useMemo(
    () => (hasLocation ? { lat: value.lat, lng: value.lng } : DEFAULT_CENTER),
    [hasLocation, value.lat, value.lng],
  );

  const pickResult = async (prediction: any) => {
    setShowDropdown(false);
    setSearchResults([]);
    setSearching(true);
    setSearchError(null);
    try {
      const details = await deliveryService.placeDetails(prediction.place_id);
      if (details.status === 'OK' && details.result) {
        const { lat, lng, formatted_address, name } = details.result;
        const label = formatted_address || name || prediction.description;
        setResolvedLabel(label);
        setAddress(label);
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

  // Fires automatically as the admin types — no "Search" button/click needed.
  // Debounced so we don't fire a request on every keystroke, and guarded
  // against out-of-order responses (a slow earlier request landing after a
  // faster later one) via latestQueryRef.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const query = address.trim();
    if (query.length < 3 || query === resolvedLabel) {
      setSearchResults([]);
      setShowDropdown(false);
      setSearchError(null);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      latestQueryRef.current = query;
      setSearching(true);
      setSearchError(null);
      try {
        const data = await deliveryService.placesAutocomplete(query);
        if (latestQueryRef.current !== query) return; // a newer keystroke superseded this request
        if (data.status === 'OK' && data.predictions?.length) {
          setSearchResults(data.predictions);
          setShowDropdown(true);
        } else {
          setSearchResults([]);
          setSearchError(`Couldn't find "${query}". Try a more specific name or a nearby landmark.`);
        }
      } catch {
        if (latestQueryRef.current === query) {
          setSearchError('Failed to search — check your connection.');
        }
      } finally {
        if (latestQueryRef.current === query) setSearching(false);
      }
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

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
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">Zone Center *</label>
        <div className="relative">
          <input
            type="text"
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              setResolvedLabel('');
            }}
            onFocus={() => {
              if (searchResults.length > 0) setShowDropdown(true);
            }}
            onBlur={() => {
              // Delay so a click on a suggestion (onMouseDown fires first) still registers.
              setTimeout(() => setShowDropdown(false), 150);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && showDropdown && searchResults.length > 0) {
                e.preventDefault();
                pickResult(searchResults[0]);
              } else if (e.key === 'Escape') {
                setShowDropdown(false);
              }
            }}
            placeholder='Start typing… e.g. "East Legon", "Accra Mall"'
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {searching && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Searching…</span>
          )}

          {showDropdown && searchResults.length > 0 && (
            <div className="absolute z-10 mt-1 w-full border border-gray-200 bg-white rounded-lg shadow-lg overflow-hidden">
              {searchResults.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault(); // keep focus/avoid blur racing the click
                    pickResult(p);
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-green-50 border-t border-gray-100 first:border-t-0"
                >
                  <span className="font-medium text-gray-900">{p.main_text}</span>
                  {p.secondary_text && <span className="text-gray-500 ml-1 text-xs">{p.secondary_text}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {resolvedLabel && (
          <div className="mt-2 text-xs text-gray-600 bg-gray-50 rounded px-3 py-2">📍 {resolvedLabel}</div>
        )}
        {!resolvedLabel && hasLocation && (
          <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded px-3 py-2">
            Current center: {value.lat.toFixed(4)}, {value.lng.toFixed(4)} — type above to change it, or drag the pin on the map below.
          </div>
        )}
        {searchError && <div className="mt-2 text-xs text-red-600">{searchError}</div>}
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
