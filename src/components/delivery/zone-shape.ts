export interface LatLng {
  lat: number;
  lng: number;
}

const KM_PER_DEG_LAT = 110.574;
const kmPerDegLng = (lat: number) => 111.32 * Math.cos((lat * Math.PI) / 180);

/**
 * A circle as an editable polygon. Corners sit slightly outside the radius
 * (circumscribed) so the polygon never covers less than the circle did.
 */
export function circlePolygon(center: LatLng, radiusKm: number, corners = 16): LatLng[] {
  const r = radiusKm / Math.cos(Math.PI / corners);
  return Array.from({ length: corners }, (_, i) => {
    const a = (2 * Math.PI * i) / corners;
    return {
      lat: center.lat + (r * Math.cos(a)) / KM_PER_DEG_LAT,
      lng: center.lng + (r * Math.sin(a)) / kmPerDegLng(center.lat),
    };
  });
}

export function centroid(points: LatLng[]): LatLng {
  return {
    lat: points.reduce((s, p) => s + p.lat, 0) / points.length,
    lng: points.reduce((s, p) => s + p.lng, 0) / points.length,
  };
}

/** Distance from the centroid to the furthest corner, in km. */
export function enclosingRadiusKm(points: LatLng[]): number {
  const c = centroid(points);
  return Math.max(
    ...points.map((p) => Math.hypot((p.lat - c.lat) * KM_PER_DEG_LAT, (p.lng - c.lng) * kmPerDegLng(c.lat))),
  );
}

/** Shoelace area on a local flat projection — fine at city scale. */
export function areaKm2(points: LatLng[]): number {
  if (points.length < 3) return 0;
  const c = centroid(points);
  const xy = points.map((p) => [(p.lng - c.lng) * kmPerDegLng(c.lat), (p.lat - c.lat) * KM_PER_DEG_LAT]);
  let sum = 0;
  for (let i = 0; i < xy.length; i++) {
    const [x1, y1] = xy[i];
    const [x2, y2] = xy[(i + 1) % xy.length];
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum) / 2;
}

/** A zone's area: its polygon if it has one, otherwise its circle. */
export function zoneAreaKm2(zone: { radius: number; polygon?: LatLng[] | null }): number {
  return zone.polygon && zone.polygon.length >= 3 ? areaKm2(zone.polygon) : Math.PI * zone.radius ** 2;
}

export function formatArea(km2: number): string {
  return `${km2 < 10 ? km2.toFixed(1) : Math.round(km2).toLocaleString()} km²`;
}
