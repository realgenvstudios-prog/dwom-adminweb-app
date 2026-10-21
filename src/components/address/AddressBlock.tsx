import { Copy, ExternalLink, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { type AddressPlace, mapsUrl, plusCodeOf, withoutPlusCode } from './address-utils';

interface AddressBlockProps {
  addressText: string | null | undefined;
  place?: AddressPlace | null;
  /** Shown when there's no address. */
  empty?: string;
}

/**
 * A delivery address the way a rider needs it: the place picked in the app
 * ("Laurel Beauty Parlour"), the readable address, the Plus Code (precise to
 * a few metres, copyable) and a link to the exact pin in Google Maps.
 */
export default function AddressBlock({ addressText, place, empty = 'No address on file' }: AddressBlockProps) {
  if (!addressText && !place?.placeName) {
    return (
      <div className="flex gap-3">
        <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <p className="text-muted-foreground">{empty}</p>
      </div>
    );
  }
  const code = plusCodeOf(addressText, place);
  const text = withoutPlusCode(addressText ?? '');
  const url = mapsUrl(place, code);

  const copy = () => {
    if (!code) return;
    void navigator.clipboard.writeText(code).then(
      () => toast.success('Plus Code copied'),
      () => toast.error('Couldn’t copy'),
    );
  };

  return (
    <div className="flex gap-3">
      <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1 space-y-1.5">
        {place?.placeName && <p className="font-medium">{place.placeName}</p>}
        {text && text !== place?.placeName && <p className={place?.placeName ? 'text-muted-foreground' : undefined}>{text}</p>}
        {(code || url) && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {code && (
              <span
                className="inline-flex items-center gap-1 rounded-md border bg-muted/50 py-0.5 pr-0.5 pl-2 font-mono text-xs"
                title="Google Plus Code: type it into Google Maps to land within a few metres"
              >
                <span className="text-muted-foreground">Plus Code</span>
                <span className="font-semibold">{code}</span>
                <Button variant="ghost" size="icon" className="size-6" onClick={copy} aria-label="Copy Plus Code">
                  <Copy className="size-3" />
                </Button>
              </span>
            )}
            {url && (
              <Button asChild variant="outline" size="sm" className="h-7 text-xs">
                <a href={url} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-3" />
                  Open in Google Maps
                </a>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
