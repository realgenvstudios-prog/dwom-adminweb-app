import { useEffect, useState } from 'react';
import { BellRing, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import adminPushService from '../../services/adminPushService';

/** Desktop notification for each new order, per browser (web push). */
export default function NewOrderAlerts() {
  const [state, setState] = useState<{ checking: boolean; supported: boolean; subscribed: boolean }>({ checking: true, supported: true, subscribed: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supported = adminPushService.isSupported();
    adminPushService.isSubscribed().then((subscribed) => !cancelled && setState({ checking: false, supported, subscribed }));
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = async () => {
    setBusy(true);
    setError(null);
    if (state.subscribed) {
      const ok = await adminPushService.unsubscribe();
      if (ok) setState((s) => ({ ...s, subscribed: false }));
      else setError('Couldn’t turn alerts off.');
    } else {
      const r = await adminPushService.subscribe();
      if (r.success) setState((s) => ({ ...s, subscribed: true }));
      else setError(r.error || 'Couldn’t turn alerts on. Check the browser allows notifications for this site.');
    }
    setBusy(false);
  };

  return (
    <section className="grid gap-3">
      <div className="flex items-start gap-3">
        <BellRing className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="flex-1">
          <p className="text-sm font-medium">New order alerts</p>
          <p className="text-xs text-muted-foreground">A desktop notification the moment an order comes in, even when this tab is closed. Set per browser.</p>
        </div>
      </div>
      {state.checking ? null : !state.supported ? (
        <p className="text-sm text-amber-700">This browser doesn’t support notifications.</p>
      ) : (
        <div className="flex items-center gap-3">
          <Button size="sm" variant={state.subscribed ? 'outline' : 'default'} onClick={() => void toggle()} disabled={busy}>
            {busy && <Loader2 className="animate-spin" />}
            {state.subscribed ? 'Turn off in this browser' : 'Turn on in this browser'}
          </Button>
          {state.subscribed && <span className="text-xs text-emerald-700">On in this browser</span>}
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </section>
  );
}
