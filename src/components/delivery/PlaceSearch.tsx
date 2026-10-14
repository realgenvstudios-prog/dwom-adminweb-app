import { useEffect, useRef, useState } from 'react';
import { Loader2, MapPin, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import deliveryService from '../../services/deliveryService';

export interface PickedPlace {
  lat: number;
  lng: number;
  label: string;
}

interface Prediction {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
}

interface PlaceSearchProps {
  id?: string;
  placeholder?: string;
  onPick: (place: PickedPlace) => void;
  /** Shown under the input after a pick. */
  showPickedLabel?: boolean;
}

// As-you-type Google Places search, proxied through the backend. Debounced,
// and ignores responses for queries the user has already typed past.
export default function PlaceSearch({ id, placeholder = 'Start typing… e.g. "East Legon", "Accra Mall"', onPick, showPickedLabel = true }: PlaceSearchProps) {
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState('');
  const [results, setResults] = useState<Prediction[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const latest = useRef('');

  useEffect(() => {
    const q = query.trim();
    if (q.length < 3 || q === picked) return;
    const t = setTimeout(async () => {
      latest.current = q;
      setBusy(true);
      setProblem(null);
      try {
        const data = await deliveryService.placesAutocomplete(q);
        if (latest.current !== q) return;
        if (data.status === 'OK' && data.predictions?.length) {
          setResults(data.predictions);
          setOpen(true);
        } else {
          setResults([]);
          setProblem(`Couldn’t find “${q}”. Try a more specific name or a nearby landmark.`);
        }
      } catch {
        if (latest.current === q) setProblem('Search failed — check your connection.');
      } finally {
        if (latest.current === q) setBusy(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [query, picked]);

  const pick = async (p: Prediction) => {
    setOpen(false);
    setResults([]);
    setBusy(true);
    setProblem(null);
    try {
      const details = await deliveryService.placeDetails(p.place_id);
      if (details.status === 'OK' && details.result) {
        const label = details.result.formatted_address || details.result.name || p.description;
        setPicked(label);
        setQuery(label);
        onPick({ lat: details.result.lat, lng: details.result.lng, label });
      } else {
        setProblem('Found the place but not its coordinates. Try another result.');
      }
    } catch {
      setProblem('Couldn’t look up that place.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative grid gap-1.5">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          value={query}
          autoComplete="off"
          onChange={(e) => {
            setQuery(e.target.value);
            setPicked('');
            if (e.target.value.trim().length < 3) {
              setResults([]);
              setOpen(false);
              setProblem(null);
            }
          }}
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && open && results.length > 0) {
              e.preventDefault();
              void pick(results[0]);
            } else if (e.key === 'Escape') setOpen(false);
          }}
          placeholder={placeholder}
          className="pr-8 pl-8"
        />
        {busy && <Loader2 className="absolute top-1/2 right-2.5 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
        {open && results.length > 0 && (
          <ul className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-md">
            {results.map((p) => (
              <li key={p.place_id}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    void pick(p);
                  }}
                  className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                >
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  <span>
                    <span className="font-medium">{p.main_text}</span>
                    {p.secondary_text && <span className="ml-1 text-xs text-muted-foreground">{p.secondary_text}</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {problem && <p className="text-xs text-destructive">{problem}</p>}
      {showPickedLabel && picked && !problem && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="size-3" />
          {picked}
        </p>
      )}
    </div>
  );
}
