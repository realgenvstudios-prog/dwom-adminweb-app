export interface AddressPlace {
  placeName: string | null;
  plusCode: string | null;
  lat: number | null;
  lng: number | null;
}

const PLUS_CODE = /^([23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{0,3})\b,?\s*/i;

/** "MRFM+FPX, 404 New Rd, Madina" → "404 New Rd, Madina" (the code is shown separately). */
export const withoutPlusCode = (text: string) => text.replace(PLUS_CODE, '').trim();

/** A Plus Code stored on the address, or one at the start of older address text. */
export function plusCodeOf(addressText: string | null | undefined, place: AddressPlace | null | undefined): string | null {
  return place?.plusCode || addressText?.match(PLUS_CODE)?.[1] || null;
}

/** Google Maps link to the exact pin (falls back to searching the Plus Code). */
export function mapsUrl(place: AddressPlace | null | undefined, plusCode: string | null): string | null {
  if (place?.lat != null && place?.lng != null) return `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`;
  if (plusCode) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(plusCode)}`;
  return null;
}

/** One line for tables and exports: "Laurel Beauty Parlour · New Rd, Madina". */
export function addressLine(addressText: string | null | undefined, place: AddressPlace | null | undefined): string {
  const text = withoutPlusCode(addressText ?? '');
  return [place?.placeName, text && text !== place?.placeName ? text : null].filter(Boolean).join(' · ') || (addressText ?? '');
}
