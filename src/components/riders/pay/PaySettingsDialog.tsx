import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import adminApiClient from '../../../services/apiClient';

interface PaySettings {
  defaultRiderPay: number;
  riderCancelPayPercent: number;
  riderNoShowPayPercent: number;
  payoutWeekday: number;
  cashoutEnabled: boolean;
  cashoutFromTime: string | null;
  cashoutMinAmount: number;
  cashoutMaxPerDay: number;
  cashoutFee: number;
  cashoutNeedsApproval: boolean;
  riderCashLimit: number;
  payoutsViaPaystack: boolean;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function Num({ id, label, hint, value, onChange, suffix }: { id: string; label: string; hint?: string; value: number; onChange: (v: number) => void; suffix?: string }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input id={id} type="number" min={0} step={0.5} value={Number.isFinite(value) ? value : ''} onChange={(e) => onChange(e.target.valueAsNumber)} className={suffix ? 'pr-12' : ''} />
        {suffix && <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">{suffix}</span>}
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Toggle({ id, label, hint, checked, onChange }: { id: string; label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
      <div>
        <Label htmlFor={id}>{label}</Label>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

/** Rider pay rules: default pay, cancellation pay, weekly payouts, cash out, cash limit, Paystack. */
export default function PaySettingsDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<PaySettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApiClient
      .get<PaySettings>('/rider-pay/settings')
      .then(setForm)
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Couldn’t load pay settings'));
  }, []);

  const set = (patch: Partial<PaySettings>) => setForm((f) => (f ? { ...f, ...patch } : f));

  const save = async () => {
    if (!form) return;
    setSaving(true);
    try {
      await adminApiClient.patch('/rider-pay/settings', { ...form, cashoutFromTime: form.cashoutFromTime || null });
      toast.success('Pay settings saved');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Couldn’t save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Pay settings</DialogTitle>
          <DialogDescription>Each zone can set its own rider pay in Delivery Zones; the default below covers zones that don’t.</DialogDescription>
        </DialogHeader>

        {!form ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-6">
            <section className="grid gap-4">
              <h3 className="text-sm font-medium">Pay per delivery</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <Num id="ps-default" label="Default rider pay" value={form.defaultRiderPay} onChange={(v) => set({ defaultRiderPay: v })} suffix="GH₵" />
                <Num id="ps-cancel" label="Cancelled after pickup" hint="Of the pay, when it’s not the rider’s fault" value={form.riderCancelPayPercent} onChange={(v) => set({ riderCancelPayPercent: v })} suffix="%" />
                <Num id="ps-noshow" label="Customer unreachable" hint="When the rider followed the call-and-wait steps" value={form.riderNoShowPayPercent} onChange={(v) => set({ riderNoShowPayPercent: v })} suffix="%" />
              </div>
            </section>

            <section className="grid gap-4">
              <h3 className="text-sm font-medium">Weekly payout</h3>
              <div className="grid gap-1.5 sm:max-w-[220px]">
                <Label>Pay day</Label>
                <Select value={String(form.payoutWeekday)} onValueChange={(v) => set({ payoutWeekday: Number(v) })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map((d, i) => (
                      <SelectItem key={d} value={String(i)}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Everything owed is paid out at 6:00 that morning.</p>
              </div>
            </section>

            <section className="grid gap-4">
              <h3 className="text-sm font-medium">Cash out (same day)</h3>
              <Toggle id="ps-co" label="Riders can cash out" hint="Ask for their balance before the weekly payout." checked={form.cashoutEnabled} onChange={(v) => set({ cashoutEnabled: v })} />
              {form.cashoutEnabled && (
                <>
                  <div className="grid gap-4 sm:grid-cols-4">
                    <div className="grid gap-1.5">
                      <Label htmlFor="ps-time">From (time)</Label>
                      <Input id="ps-time" type="time" value={form.cashoutFromTime ?? ''} onChange={(e) => set({ cashoutFromTime: e.target.value || null })} />
                      <p className="text-xs text-muted-foreground">Empty = any time</p>
                    </div>
                    <Num id="ps-min" label="Minimum" value={form.cashoutMinAmount} onChange={(v) => set({ cashoutMinAmount: v })} suffix="GH₵" />
                    <Num id="ps-fee" label="Fee" value={form.cashoutFee} onChange={(v) => set({ cashoutFee: v })} suffix="GH₵" />
                    <Num id="ps-max" label="Times a day" value={form.cashoutMaxPerDay} onChange={(v) => set({ cashoutMaxPerDay: v })} />
                  </div>
                  <Toggle id="ps-appr" label="Admin approves each cash out" hint="Off: cash outs go straight out (with Paystack on)." checked={form.cashoutNeedsApproval} onChange={(v) => set({ cashoutNeedsApproval: v })} />
                </>
              )}
            </section>

            <section className="grid gap-4">
              <h3 className="text-sm font-medium">Cash orders</h3>
              <div className="sm:max-w-[220px]">
                <Num id="ps-limit" label="Cash a rider may hold" hint="Above this, they stop getting cash orders until they hand it in." value={form.riderCashLimit} onChange={(v) => set({ riderCashLimit: v })} suffix="GH₵" />
              </div>
            </section>

            <section className="grid gap-4">
              <h3 className="text-sm font-medium">Sending money</h3>
              <Toggle
                id="ps-ps"
                label="Send payouts with Paystack"
                hint="Needs Transfers enabled on your Paystack account and money in your Paystack balance. Off: pay riders yourself and mark each payout paid."
                checked={form.payoutsViaPaystack}
                onChange={(v) => set({ payoutsViaPaystack: v })}
              />
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
