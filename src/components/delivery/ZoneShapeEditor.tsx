import { useCallback, useEffect, useRef, useState } from 'react';
import { GoogleMap, Polygon, useJsApiLoader } from '@react-google-maps/api';
import { Circle as CircleIcon, MousePointerClick } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import PlaceSearch from './PlaceSearch';
import { areaKm2, centroid, circlePolygon, formatArea, type LatLng } from './zone-shape';

interface ZoneShapeEditorProps {
  /** Starting shape; later edits flow out through onChange only. */
  initialShape: LatLng[] | null;
  onChange: (shape: LatLng[]) => void;
}

const ACCRA = { lat: 5.6037, lng: -0.187 };
const CIRCLE_SIZES = [2, 5, 10];
const STYLE = { fillColor: '#16a34a', fillOpacity: 0.15, strokeColor: '#16a34a', strokeWeight: 2 };

// The polygon and the map's centre are deliberately *uncontrolled*: we seed
// them, Google owns them during editing, and we read the result back. The
// old circle passed every intermediate drag position back in as props and
// re-centred the map on the shape — the map then panned under the cursor
// mid-drag, so the shape ran away "way further" than the mouse moved.
export default function ZoneShapeEditor({ initialShape, onChange }: ZoneShapeEditorProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    id: 'dwom-admin-google-maps',
  });

  // `seed` only changes when we replace the shape (search, reset); the
  // Polygon calls setPaths() only then.
  const [seed, setSeed] = useState<{ points: LatLng[]; version: number } | null>(() =>
    initialShape && initialShape.length >= 3 ? { points: initialShape, version: 0 } : null,
  );
  const [current, setCurrent] = useState<LatLng[] | null>(initialShape);
  const [mapCenter, setMapCenter] = useState<LatLng>(() => (initialShape?.length ? centroid(initialShape) : ACCRA));
  const [polygon, setPolygon] = useState<google.maps.Polygon | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const dragging = useRef(false);

  const commit = useCallback(() => {
    if (!polygon) return;
    const pts = polygon
      .getPath()
      .getArray()
      .map((p) => ({ lat: p.lat(), lng: p.lng() }));
    setCurrent(pts);
    onChange(pts);
  }, [polygon, onChange]);

  // Re-attach to the path whenever the polygon (re)loads or is re-seeded.
  useEffect(() => {
    if (!polygon) return;
    const path = polygon.getPath();
    const listeners = (['set_at', 'insert_at', 'remove_at'] as const).map((ev) =>
      path.addListener(ev, () => {
        // Moving the whole shape fires set_at for every corner; wait for dragend.
        if (!dragging.current) commit();
      }),
    );
    return () => listeners.forEach((l) => l.remove());
  }, [polygon, seed?.version, commit]);

  const fitTo = (pts: LatLng[]) => {
    if (!mapRef.current || pts.length < 3) return;
    const b = new google.maps.LatLngBounds();
    pts.forEach((p) => b.extend(p));
    mapRef.current.fitBounds(b, 48);
  };

  const replaceShape = (pts: LatLng[]) => {
    setSeed((s) => ({ points: pts, version: (s?.version ?? 0) + 1 }));
    setCurrent(pts);
    onChange(pts);
    fitTo(pts);
  };

  const resetToCircle = (km: number) => {
    const center = current?.length ? centroid(current) : mapCenter;
    replaceShape(circlePolygon(center, km));
  };

  return (
    <div className="grid gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="zone-center">{seed ? 'Move the zone to' : 'Where is this zone?'}</Label>
        <PlaceSearch
          id="zone-center"
          onPick={(p) => {
            setMapCenter({ lat: p.lat, lng: p.lng });
            replaceShape(circlePolygon({ lat: p.lat, lng: p.lng }, 5));
          }}
        />
      </div>

      {loadError && (
        <p className="rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-800">
          The map couldn’t load, so the zone’s shape can’t be edited right now. Check the Google Maps API key.
        </p>
      )}

      {isLoaded && (
        <div className="overflow-hidden rounded-lg border">
          <div className="relative">
            <GoogleMap
              center={mapCenter}
              zoom={12}
              mapContainerStyle={{ width: '100%', height: '380px' }}
              onLoad={(map) => {
                mapRef.current = map;
                if (seed) fitTo(seed.points);
              }}
              options={{
                streetViewControl: false,
                mapTypeControl: true,
                fullscreenControl: true,
                clickableIcons: false,
                gestureHandling: 'greedy',
              }}
            >
              {seed && (
                <Polygon
                  key="zone"
                  paths={seed.points}
                  editable
                  draggable
                  options={STYLE}
                  onLoad={setPolygon}
                  onUnmount={() => setPolygon(null)}
                  onDragStart={() => {
                    dragging.current = true;
                  }}
                  onDragEnd={() => {
                    dragging.current = false;
                    commit();
                  }}
                  onRightClick={(e) => {
                    // Polygon clicks are PolyMouseEvents; the wrapper types them as MapMouseEvent.
                    const vertex = (e as google.maps.PolyMouseEvent).vertex;
                    const path = polygon?.getPath();
                    if (path && vertex != null && path.getLength() > 3) path.removeAt(vertex);
                  }}
                />
              )}
            </GoogleMap>
            {!seed && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/60 text-sm text-muted-foreground backdrop-blur-[1px]">
                Search for a place above to start the zone.
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-muted/40 px-3 py-2">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MousePointerClick className="size-3.5 shrink-0" />
              Drag a corner to reshape · drag a midpoint to add a corner · right-click a corner to remove it · drag inside to move
            </p>
            {current && current.length >= 3 && (
              <span className="text-xs font-medium tabular-nums">
                {formatArea(areaKm2(current))} · {current.length} corners
              </span>
            )}
          </div>
        </div>
      )}

      {seed && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Start over as a circle:</span>
          {CIRCLE_SIZES.map((km) => (
            <Button key={km} type="button" variant="outline" size="xs" onClick={() => resetToCircle(km)}>
              <CircleIcon />
              {km} km
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
