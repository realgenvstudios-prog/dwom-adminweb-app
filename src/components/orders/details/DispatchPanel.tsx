import { useCallback, useEffect, useState } from 'react';
import { Loader2, Radar } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import adminApiClient from '../../../services/apiClient';
import { can } from '../../../config/permissions';

interface Offer {
  id: number;
  rider: string;
  round: number;
  distanceKm: number | null;
  status: 'offered' | 'accepted' | 'declined' | 'expired' | 'taken' | 'withdrawn';
  offeredAt: string;
  respondedAt: string | null;
}

const STATUS: Record<Offer['status'], { label: string; className: string }> = {
  offered: { label: 'Waiting', className: 'border-sky-500/30 bg-sky-500/10 text-sky-700' },
  accepted: { label: 'Accepted', className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700' },
  declined: { label: 'Skipped', className: 'border-border bg-muted text-muted-foreground' },
  expired: { label: 'No answer', className: 'border-border bg-muted text-muted-foreground' },
  taken: { label: 'Too late', className: 'border-border bg-muted text-muted-foreground' },
  withdrawn: { label: 'Withdrawn', className: 'border-border bg-muted text-muted-foreground' },
};

const seconds = (o: Offer) => (o.respondedAt ? `${Math.max(1, Math.round((new Date(o.respondedAt).getTime() - new Date(o.offeredAt).getTime()) / 1000))} s` : '');

/** Who an order was offered to and how they answered; send offers by hand. */
export default function DispatchPanel({ orderId, status, hasRider, onChanged }: { orderId: string; status: string; hasRider: boolean; onChanged: () => void }) {
  const [data, setData] = useState<{ state: string | null; offers: Offer[] } | null>(null);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await adminApiClient.get(`/orders/${orderId}/offers`));
    } catch {
      setData({ state: null, offers: [] });
    }
  }, [orderId]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    // While offers are out, keep the answers coming in.
    const every = setInterval(() => void load(), 8000);
    return () => {
      clearTimeout(t);
      clearInterval(every);
    };
  }, [load, status, hasRider]);

  const send = async () => {
    setSending(true);
    try {
      await adminApiClient.post(`/orders/${orderId}/dispatch`);
      toast.success('Offers sent to nearby riders');
      await load();
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Couldn’t send offers');
    } finally {
      setSending(false);
    }
  };

  const canSend = can('orders.assignRider') && !hasRider && !['delivered', 'cancelled'].includes(status) && data?.state !== 'searching';
  if (!data || (!data.offers.length && !canSend)) return null;

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Radar className="size-4 text-muted-foreground" />
          Rider offers
          {data.state === 'searching' && (
            <Badge variant="outline" className="border-sky-500/30 bg-sky-500/10 text-sky-700">
              Searching
            </Badge>
          )}
          {data.state === 'no_rider' && (
            <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-700">
              Nobody accepted
            </Badge>
          )}
        </div>
        {canSend && (
          <Button size="sm" variant="outline" onClick={() => void send()} disabled={sending}>
            {sending && <Loader2 className="animate-spin" />}
            {data.offers.length ? 'Offer again' : 'Offer to nearby riders'}
          </Button>
        )}
      </div>
      {data.state === 'no_rider' && <p className="text-xs text-muted-foreground">Assign a rider by hand, or offer again once more riders are online.</p>}
      {data.offers.length > 0 && (
        <ul className="divide-y text-sm">
          {data.offers.map((o) => (
            <li key={o.id} className="flex items-center justify-between gap-3 py-1.5">
              <span>
                {o.rider}
                <span className="text-muted-foreground tabular-nums">
                  {' '}
                  · round {o.round}
                  {o.distanceKm != null ? ` · ${o.distanceKm} km` : ''}
                </span>
              </span>
              <span className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground tabular-nums">{seconds(o)}</span>
                <Badge variant="outline" className={STATUS[o.status].className}>
                  {STATUS[o.status].label}
                </Badge>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
