import { useState } from 'react';
import { Dices, Loader2, Percent } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import couponService, { type Coupon } from '../../services/couponService';
import type { Campaign } from '../../services/marketingService';
import { logger } from '../../utils/logger';
import { formatGhs } from '../orders/order-status';
import { channelOf, num } from './campaign-meta';
import { normalizeCode, randomCode } from './coupon-meta';

const NONE = 'none';

interface CouponDialogProps {
  /** null = new. Mount with a fresh `key` per open. */
  coupon: Coupon | null;
  campaigns: Campaign[];
  /** Preselects a campaign for a new code. */
  campaignId?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export default function CouponDialog({ coupon, campaigns, campaignId, open, onOpenChange, onSaved }: CouponDialogProps) {
  const editing = !!coupon;
  const [form, setForm] = useState({
    code: coupon?.code ?? '',
    discountType: (coupon?.discountType ?? 'percentage') as Coupon['discountType'],
    discountValue: coupon ? String(num(coupon.discountValue)) : '',
    minOrderAmount: coupon && num(coupon.minOrderAmount) > 0 ? String(num(coupon.minOrderAmount)) : '',
    maxUses: coupon?.maxUses != null ? String(coupon.maxUses) : '',
    usagePerUser: String(coupon?.usagePerUser ?? 1),
    expiresAt: coupon?.expiresAt ? coupon.expiresAt.slice(0, 10) : '',
    campaignId: String(coupon?.campaignId ?? campaignId ?? NONE),
    description: coupon?.description ?? '',
  });
  const [problem, setProblem] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const value = Number.parseFloat(form.discountValue);
  const min = form.minOrderAmount.trim() === '' ? 0 : Number.parseFloat(form.minOrderAmount);
  const pct = form.discountType === 'percentage';
  // Campaigns that can still drive orders (plus whatever this code is already linked to).
  const linkable = campaigns.filter((c) => c.status !== 'ended' || String(c.id) === form.campaignId);

  const save = async () => {
    const code = normalizeCode(form.code);
    const maxUses = form.maxUses.trim() === '' ? null : Number.parseInt(form.maxUses, 10);
    const perUser = Number.parseInt(form.usagePerUser, 10);
    if (!editing && code.length < 3) return setProblem('Codes need at least 3 letters or numbers.');
    if (!(value > 0)) return setProblem('Enter a discount above 0.');
    if (pct && value > 100) return setProblem('A percentage can’t be more than 100.');
    if (!(min >= 0)) return setProblem('Minimum order must be 0 or more.');
    if (maxUses !== null && !(maxUses >= 1)) return setProblem('Total uses must be at least 1, or left empty for no limit.');
    if (!editing && !(perUser >= 1)) return setProblem('Uses per customer must be at least 1.');
    setProblem(null);
    const linked = form.campaignId === NONE ? null : Number(form.campaignId);
    try {
      setSaving(true);
      if (coupon) {
        // The server doesn't change code, type or per-customer limit on edit.
        await couponService.update(coupon.id, {
          description: form.description.trim(),
          discountValue: value,
          minOrderAmount: min,
          maxUses,
          expiresAt: form.expiresAt || null,
          campaignId: linked,
        });
        toast.success(`${coupon.code} saved`);
      } else {
        await couponService.create({
          code,
          description: form.description.trim(),
          discountType: form.discountType,
          discountValue: value,
          minOrderAmount: min,
          maxUses,
          usagePerUser: perUser,
          expiresAt: form.expiresAt || null,
          campaignId: linked,
        });
        toast.success(`${code} created`, {
          description: 'Customers can use it at checkout now.',
        });
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      logger.error('Failed to save discount code:', err);
      const msg = err instanceof Error ? err.message : '';
      setProblem(msg.includes('already exists') ? 'That code is already taken.' : msg || 'Couldn’t save the code.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? `Edit ${coupon.code}` : 'New discount code'}</DialogTitle>
          <DialogDescription>Customers type the code at checkout. It works as soon as it’s saved.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {!editing && (
            <div className="grid gap-1.5">
              <Label htmlFor="cc-code">Code</Label>
              <div className="flex gap-2">
                <Input
                  id="cc-code"
                  value={form.code}
                  onChange={(e) => set({ code: normalizeCode(e.target.value) })}
                  placeholder="e.g. WEEKEND10"
                  className="font-mono tracking-wider uppercase"
                  autoFocus
                />
                <Button type="button" variant="outline" onClick={() => set({ code: randomCode() })}>
                  <Dices />
                  Generate
                </Button>
              </div>
            </div>
          )}

          <div className="grid gap-1.5">
            <Label>Discount</Label>
            <div className="flex gap-2">
              {!editing && (
                <div className="grid shrink-0 grid-cols-2 rounded-md border p-0.5">
                  {(['percentage', 'fixed'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => set({ discountType: t })}
                      aria-pressed={form.discountType === t}
                      className={cn('rounded px-3 text-sm transition-colors', form.discountType === t ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}
                    >
                      {t === 'percentage' ? '%' : '₵'}
                    </button>
                  ))}
                </div>
              )}
              <div className="relative flex-1">
                {!pct && <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">₵</span>}
                <Input
                  id="cc-value"
                  type="number"
                  min={0}
                  max={pct ? 100 : undefined}
                  step={pct ? 1 : 0.01}
                  value={form.discountValue}
                  onChange={(e) => set({ discountValue: e.target.value })}
                  className={cn('tabular-nums', !pct && 'pl-7', pct && 'pr-8')}
                  aria-label="Discount amount"
                />
                {pct && <Percent className="pointer-events-none absolute top-1/2 right-3 size-3.5 -translate-y-1/2 text-muted-foreground" />}
              </div>
            </div>
            {value > 0 && (
              <p className="text-xs text-muted-foreground">
                {pct ? (
                  <>
                    A {formatGhs(Math.max(min, 100))} order saves{' '}
                    <span className="font-medium text-foreground">{formatGhs((Math.max(min, 100) * Math.min(value, 100)) / 100)}</span>.
                  </>
                ) : (
                  <>Takes {formatGhs(value)} off any qualifying order (never more than the order itself).</>
                )}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="cc-min">Minimum order</Label>
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">₵</span>
                <Input
                  id="cc-min"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.minOrderAmount}
                  onChange={(e) => set({ minOrderAmount: e.target.value })}
                  placeholder="None"
                  className="pl-7 tabular-nums"
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cc-exp">Valid until</Label>
              <Input id="cc-exp" type="date" value={form.expiresAt} onChange={(e) => set({ expiresAt: e.target.value })} />
              <p className="text-xs text-muted-foreground">{form.expiresAt ? 'Works through the end of that day.' : 'Empty = never expires.'}</p>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cc-max">Total uses</Label>
              <Input id="cc-max" type="number" min={1} value={form.maxUses} onChange={(e) => set({ maxUses: e.target.value })} placeholder="No limit" className="tabular-nums" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cc-per">Uses per customer</Label>
              <Input
                id="cc-per"
                type="number"
                min={1}
                value={form.usagePerUser}
                onChange={(e) => set({ usagePerUser: e.target.value })}
                disabled={editing}
                className="tabular-nums"
              />
              {editing && <p className="text-xs text-muted-foreground">Can’t be changed after creating.</p>}
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="cc-camp">Campaign</Label>
            <Select value={form.campaignId} onValueChange={(v) => set({ campaignId: v })}>
              <SelectTrigger id="cc-camp" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Not linked</SelectItem>
                {linkable.map((c) => {
                  const ch = channelOf(c.channel);
                  return (
                    <SelectItem key={c.id} value={String(c.id)}>
                      <ch.icon className="text-muted-foreground" />
                      {c.name}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Every paid order using this code is credited to the campaign. This is how SMS, email and social get measured.</p>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="cc-desc">Internal note</Label>
            <Input id="cc-desc" value={form.description} onChange={(e) => set({ description: e.target.value })} placeholder="Optional, e.g. Flyers at Madina market" />
          </div>
        </div>

        <DialogFooter className="items-center">
          {problem && <p className="mr-auto text-sm text-destructive">{problem}</p>}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void save()} disabled={saving}>
            {saving && <Loader2 className="animate-spin" />}
            {editing ? 'Save changes' : 'Create code'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
