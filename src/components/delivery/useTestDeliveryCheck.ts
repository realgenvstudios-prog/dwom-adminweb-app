import { useEffect, useRef, useState } from "react";
import deliveryService from "../../services/deliveryService";

// Live, as-you-type address autocomplete + delivery check for the "Test
// Delivery Check" card — mirrors ZoneLocationPicker's own address search.
// Split out of the former monolithic DeliveryZonesPage. Takes setError
// from useZonesData since lookup failures surface through that banner.
export function useTestDeliveryCheck(setError: (error: string | null) => void) {
  const [testAddress, setTestAddress] = useState("");
  const [geocoding, setGeocoding] = useState(false);
  const [geocodedLabel, setGeocodedLabel] = useState("");
  const [geocodeResults, setGeocodeResults] = useState<any[]>([]);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const addressDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addressLatestQueryRef = useRef("");

  // Live, as-you-type suggestions — only fetches predictions here;
  // resolving a pick (place details + the actual delivery check) happens
  // in pickGeoResult below.
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

  return {
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
  };
}
