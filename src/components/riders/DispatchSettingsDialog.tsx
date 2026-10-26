import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import adminApiClient from '../../services/apiClient';

interface DispatchSettings {
  dispatchMode: 'manual' | 'auto';
  dispatchRadiusKm: number;
  dispatchMaxRadiusKm: number;
  dispatchFirstRoundRiders: number;
  dispatchRoundSeconds: number;
  riderNoShowCalls: number;
  riderNoShowWaitMinutes: number;
}

const MODES: { key: DispatchSettings['dispatchMode']; title: string; text: string }[] = [
  { key: 'manual', title: 'Manual', text: 'Admins assign every order to a rider.' },
  { key: 'auto', title: 'Automatic', text: 'When an order is marked ready, nearby riders get an offer. The first to accept gets it.' },
];

function NumberField({ id, label, hint, value, onChange, step = 1 }: { id: string; label: string; hint: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type="number" inputMode="decimal" step={step} value={Number.isFinite(value) ? value : ''} onChange={(e) => onChange(e.target.valueAsNumber)} />
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

/** How orders reach riders: manual assignment or automatic offer rounds. */
export default function DispatchSettingsDialog({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState<DispatchSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApiClient
      .get<DispatchSettings>('/dispatch/settings')
      .then(setForm)
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Couldn’t load dispatch settings'));
  }, []);

  const set = (patch: Partial<DispatchSettings>) => setForm((f) => (f ? { ...f, ...patch } : f));

  const save = async () => {
    if (!form) return;
    setSaving(true);
    try {
      setForm(await adminApiClient.patch<DispatchSettings>('/dispatch/settings', form));
      toast.success(form.dispatchMode === 'auto' ? 'Automatic dispatch is on' : 'Dispatch settings saved');
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Couldn’t save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Dispatch settings</DialogTitle>
          <DialogDescription>Choose how orders reach riders. Admins can always assign or switch a rider by hand until pickup.</DialogDescription>
        </DialogHeader>

        {!form ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-6">
            <div className="grid gap-2 sm:grid-cols-2">
              {MODES.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => set({ dispatchMode: m.key })}
                  className={cn('rounded-lg border p-4 text-left transition-colors', form.dispatchMode === m.key ? 'border-foreground ring-1 ring-foreground' : 'hover:bg-muted')}
                  aria-pressed={form.dispatchMode === m.key}
                >
                  <p className="font-medium">{m.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{m.text}</p>
                </button>
              ))}
            </div>

            <section className={cn('grid gap-4', form.dispatchMode !== 'auto' && 'opacity-60')}>
              <div>
                <h3 className="text-sm font-medium">Offer rounds</h3>
                <p className="text-xs text-muted-foreground">Round 1 goes to the closest riders. If nobody accepts, round 2 widens to everyone within the maximum radius. If still nobody accepts, admins are alerted.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <NumberField id="ds-r1" label="First radius (km)" hint="From the pickup point" value={form.dispatchRadiusKm} step={0.5} onChange={(v) => set({ dispatchRadiusKm: v })} />
                <NumberField id="ds-r2" label="Maximum radius (km)" hint="Used in round 2" value={form.dispatchMaxRadiusKm} step={0.5} onChange={(v) => set({ dispatchMaxRadiusKm: v })} />
                <NumberField id="ds-n" label="Riders in round 1" hint="Closest first, then who waited longest" value={form.dispatchFirstRoundRiders} onChange={(v) => set({ dispatchFirstRoundRiders: v })} />
                <NumberField id="ds-s" label="Seconds per round" hint="How long riders have to accept" value={form.dispatchRoundSeconds} onChange={(v) => set({ dispatchRoundSeconds: v })} />
              </div>
            </section>

            <section className="grid gap-4">
              <div>
                <h3 className="text-sm font-medium">Customer not responding</h3>
                <p className="text-xs text-muted-foreground">After arriving, a rider can cancel as “customer unreachable” only after this many calls and this wait.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <NumberField id="ds-calls" label="Calls required" hint="Made from the rider app" value={form.riderNoShowCalls} onChange={(v) => set({ riderNoShowCalls: v })} />
                <NumberField id="ds-wait" label="Wait (minutes)" hint="Counted from “I’ve arrived”" value={form.riderNoShowWaitMinutes} onChange={(v) => set({ riderNoShowWaitMinutes: v })} />
              </div>
            </section>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void save()} disabled={!form || saving}>
            {saving && <Loader2 className="animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
