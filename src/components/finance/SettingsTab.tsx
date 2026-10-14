import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Loader2, RotateCw, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { settingsService, type Settings } from '../../services/settingsService';
import { logger } from '../../utils/logger';
import { formatGhs } from '../orders/order-status';

type Key =
  | 'minimumOrderValue'
  | 'maxSmallOrderFee'
  | 'paystackFeePercent'
  | 'packagingCostPerOrder'
  | 'grossProfitMarginPercent'
  | 'pickerRatePerOrder'
  | 'pickerDailyMinimumPay'
  | 'pickerDailyThreshold';

interface Field {
  key: Key;
  label: string;
  hint: string;
  unit: '₵' | '%' | 'orders';
  integer?: boolean;
}

// Grouped by what each number actually changes in the backend.
const SECTIONS: { title: string; description: string; affectsCustomers?: boolean; fields: Field[] }[] = [
  {
    title: 'Small-order fee',
    description: 'Charged at checkout: a basket below the minimum pays the difference, up to the cap.',
    affectsCustomers: true,
    fields: [
      { key: 'minimumOrderValue', label: 'Minimum basket', hint: 'At or above this, no small-order fee.', unit: '₵' },
      { key: 'maxSmallOrderFee', label: 'Fee cap', hint: 'The most a small basket is ever charged.', unit: '₵' },
    ],
  },
  {
    title: 'Cost assumptions',
    description: 'Used to work out profit. Changing these doesn’t change what anyone pays.',
    fields: [
      { key: 'paystackFeePercent', label: 'Paystack fee', hint: 'Estimated card / mobile money processing cost.', unit: '%' },
      { key: 'packagingCostPerOrder', label: 'Packaging per order', hint: 'Added to every order’s cost.', unit: '₵' },
      { key: 'grossProfitMarginPercent', label: 'Fallback margin', hint: 'Used to estimate profit when no product costs are recorded.', unit: '%' },
    ],
  },
  {
    title: 'Picker pay',
    description: 'Each picker’s day is paid per order once they reach the threshold, otherwise a flat minimum. Applies to trips recalculated after saving.',
    fields: [
      { key: 'pickerDailyThreshold', label: 'Threshold', hint: 'Orders in a day to switch to per-order pay.', unit: 'orders', integer: true },
      { key: 'pickerRatePerOrder', label: 'Pay per order', hint: 'At or above the threshold.', unit: '₵' },
      { key: 'pickerDailyMinimumPay', label: 'Daily minimum', hint: 'Below the threshold, for the whole day.', unit: '₵' },
    ],
  },
];

const KEYS = SECTIONS.flatMap((s) => s.fields.map((f) => f.key));

function UnitInput({ field, value, disabled, onChange }: { field: Field; value: string; disabled: boolean; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      {field.unit === '₵' && <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">₵</span>}
      <Input
        id={`fs-${field.key}`}
        type="number"
        min={0}
        step={field.integer ? 1 : 0.01}
        inputMode={field.integer ? 'numeric' : 'decimal'}
        value={value}
        disabled={disabled}
        placeholder={disabled ? 'Not available' : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={`tabular-nums ${field.unit === '₵' ? 'pl-7' : ''} ${field.unit !== '₵' ? 'pr-16' : ''}`}
      />
      {field.unit !== '₵' && (
        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">{field.unit}</span>
      )}
    </div>
  );
}

const SettingsTab: React.FC = () => {
  const [saved, setSaved] = useState<Record<Key, string> | null>(null);
  const [form, setForm] = useState<Record<Key, string> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await settingsService.getSettings();
      const next = Object.fromEntries(
        KEYS.map((k) => {
          const v = (data as unknown as Record<string, unknown>)[k];
          return [k, v === undefined || v === null ? '' : String(v)];
        }),
      ) as Record<Key, string>;
      setSaved(next);
      setForm(next);
    } catch (err) {
      logger.error('Failed to load finance settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  const changed = form && saved ? KEYS.filter((k) => form[k] !== saved[k]) : [];
  // A field the server never returned isn't supported by the connected backend yet.
  const unavailable = (k: Key) => saved?.[k] === '';
  const n = (k: Key) => Number.parseFloat(form?.[k] ?? '') || 0;

  const save = async () => {
    if (!form) return;
    const payload: Partial<Settings> = {};
    for (const k of changed) {
      const field = SECTIONS.flatMap((s) => s.fields).find((f) => f.key === k)!;
      const v = field.integer ? Number.parseInt(form[k], 10) : Number.parseFloat(form[k]);
      if (!Number.isFinite(v) || v < 0) {
        toast.error(`${field.label} must be 0 or more.`);
        return;
      }
      (payload as Record<string, number>)[k] = v;
    }
    try {
      setSaving(true);
      await settingsService.updateSettings(payload);
      setSaved(form);
      toast.success(changed.some((k) => k === 'minimumOrderValue' || k === 'maxSmallOrderFee') ? 'Saved — checkout uses the new small-order fee now' : 'Settings saved');
    } catch (err) {
      logger.error('Failed to save finance settings:', err);
      toast.error('Couldn’t save the settings.');
    } finally {
      setSaving(false);
    }
  };

  if (error) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="size-4" />
          Couldn’t load settings: {error}
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()}>
          <RotateCw />
          Retry
        </Button>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  // Worked examples, using the numbers as currently typed.
  const sampleBasket = Math.max(0, Math.round(n('minimumOrderValue') * 0.6));
  const sampleFee = Math.min(Math.max(0, n('minimumOrderValue') - sampleBasket), n('maxSmallOrderFee'));
  const busyDay = Math.max(1, Math.round(n('pickerDailyThreshold')));

  return (
    <div className="flex flex-col gap-6 pb-20">
      <div className="grid gap-6 lg:grid-cols-2">
        {SECTIONS.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {section.title}
                {section.affectsCustomers && (
                  <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 font-normal text-amber-700">
                    Changes what customers pay
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {section.fields.map((f) => (
                  <div key={f.key} className="grid gap-1.5">
                    <Label htmlFor={`fs-${f.key}`}>{f.label}</Label>
                    <UnitInput field={f} value={form[f.key]} disabled={unavailable(f.key)} onChange={(v) => setForm({ ...form, [f.key]: v })} />
                    <p className="text-xs text-muted-foreground">{unavailable(f.key) ? 'Not supported by the connected server yet.' : f.hint}</p>
                  </div>
                ))}
              </div>
              {section.title === 'Small-order fee' && !unavailable('minimumOrderValue') && n('minimumOrderValue') > 0 && (
                <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                  Example: a {formatGhs(sampleBasket)} basket is charged a{' '}
                  <span className="font-medium text-foreground">{formatGhs(sampleFee)}</span> small-order fee.
                </p>
              )}
              {section.title === 'Picker pay' && !unavailable('pickerDailyThreshold') && (
                <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                  Example: {busyDay} orders in a day pays <span className="font-medium text-foreground">{formatGhs(busyDay * n('pickerRatePerOrder'))}</span>
                  {busyDay > 1 && (
                    <>
                      ; {busyDay - 1} pays <span className="font-medium text-foreground">{formatGhs(n('pickerDailyMinimumPay'))}</span>
                    </>
                  )}
                  .
                </p>
              )}
              {section.title === 'Picker pay' && !unavailable('pickerDailyThreshold') && busyDay * n('pickerRatePerOrder') < n('pickerDailyMinimumPay') && (
                <p className="flex items-start gap-2 rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-800">
                  <AlertCircle className="mt-px size-3.5 shrink-0" />
                  A picker who reaches the threshold earns less than the daily minimum. Raise the pay per order to at least{' '}
                  {formatGhs(Math.ceil((n('pickerDailyMinimumPay') / busyDay) * 100) / 100)}.
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {changed.length > 0 && (
        <div className="fixed inset-x-0 bottom-6 z-30 flex justify-center px-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-3 rounded-xl border bg-background/95 py-2 pr-2 pl-4 shadow-lg backdrop-blur">
            <span className="text-sm">
              {changed.length} unsaved change{changed.length === 1 ? '' : 's'}
            </span>
            <Button variant="ghost" size="sm" onClick={() => setForm(saved)} disabled={saving}>
              <Undo2 />
              Discard
            </Button>
            <Button size="sm" onClick={() => void save()} disabled={saving}>
              {saving && <Loader2 className="animate-spin" />}
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsTab;
