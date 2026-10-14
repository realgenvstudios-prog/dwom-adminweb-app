import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Circle, GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import PlaceSearch from './PlaceSearch';

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

  const circleRef = useRef<google.maps.Circle | null>(null);
  const hasLocation = value.lat !== 0 || value.lng !== 0;
  // Stable reference: the Circle diffs `center` by identity and calls
  // setCenter() on change — a fresh literal every render fights an active
  // drag and loops into "Maximum update depth exceeded" (#185).
  const center = useMemo(
    () => (hasLocation ? { lat: value.lat, lng: value.lng } : DEFAULT_CENTER),
    [hasLocation, value.lat, value.lng],
  );

  // radius_changed / center_changed fire on every pixel of a drag; commit at
  // most once per animation frame so the drag stays smooth.
  const radiusRafRef = useRef<number | null>(null);
  const centerRafRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (radiusRafRef.current !== null) cancelAnimationFrame(radiusRafRef.current);
      if (centerRafRef.current !== null) cancelAnimationFrame(centerRafRef.current);
    };
  }, []);

  const handleRadiusChanged = useCallback(() => {
    if (radiusRafRef.current !== null) return;
    radiusRafRef.current = requestAnimationFrame(() => {
      radiusRafRef.current = null;
      if (circleRef.current) {
        const meters = circleRef.current.getRadius();
        onChange({ ...value, radius: Math.round((meters / 1000) * 10) / 10 });
      }
    });
  }, [value, onChange]);

  const handleCenterChanged = useCallback(() => {
    if (centerRafRef.current !== null) return;
    centerRafRef.current = requestAnimationFrame(() => {
      centerRafRef.current = null;
      if (circleRef.current) {
        const c = circleRef.current.getCenter();
        if (c) onChange({ ...value, lat: c.lat(), lng: c.lng() });
      }
    });
  }, [value, onChange]);

  return (
    <div className="grid gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="zone-center">Zone centre</Label>
        <PlaceSearch id="zone-center" onPick={(p) => onChange({ ...value, lat: p.lat, lng: p.lng })} />
        {hasLocation && (
          <p className="text-xs text-muted-foreground tabular-nums">
            Centre {value.lat.toFixed(4)}, {value.lng.toFixed(4)} — search to move it, or drag the circle on the map.
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label>Delivery radius</Label>
          <span className="text-sm font-medium tabular-nums">{value.radius || 0} km</span>
        </div>
        <Slider min={0.5} max={20} step={0.5} value={[value.radius || 0.5]} onValueChange={([km]) => onChange({ ...value, radius: km })} />
        <div className="flex flex-wrap gap-1.5">
          {RADIUS_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => onChange({ ...value, radius: p.km })}
              className={cn(
                'rounded-full border px-2.5 py-0.5 text-xs transition-colors',
                value.radius === p.km ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted',
              )}
            >
              {p.label} · {p.km} km
            </button>
          ))}
        </div>
      </div>

      {loadError && (
        <p className="rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-800">
          The map preview isn’t available right now — search and radius still work.
        </p>
      )}

      {isLoaded && !hasLocation && (
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
          Search for a place to see it on the map.
        </div>
      )}

      {isLoaded && hasLocation && (
        <div className="overflow-hidden rounded-lg border">
          <GoogleMap
            center={center}
            zoom={12}
            mapContainerStyle={{ width: '100%', height: '300px' }}
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
              options={{ fillColor: '#16a34a', fillOpacity: 0.15, strokeColor: '#16a34a', strokeWeight: 2 }}
            />
          </GoogleMap>
          <p className="border-t bg-muted/40 px-3 py-2 text-xs text-muted-foreground">Drag the circle’s edge to resize it, or drag the circle to move it.</p>
        </div>
      )}
    </div>
  );
};

export default ZoneLocationPicker;
