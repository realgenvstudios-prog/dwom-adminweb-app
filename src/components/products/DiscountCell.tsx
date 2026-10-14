import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { discountOf } from './product-meta';
import type { Product } from './ProductTypes';

// Commits on blur or Enter — not per keystroke — and only valid 0–100 values.
export default function DiscountCell({ product, onCommit }: { product: Product; onCommit: (v: number) => Promise<void> }) {
  const current = discountOf(product);
  const [draft, setDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const commit = async () => {
    if (draft === null) return;
    const v = Number.parseFloat(draft);
    setDraft(null);
    if (!Number.isFinite(v) || v === current) return;
    setSaving(true);
    await onCommit(Math.min(100, Math.max(0, v)));
    setSaving(false);
  };

  return (
    <div className="relative w-20">
      <Input
        type="number"
        min={0}
        max={100}
        inputMode="decimal"
        aria-label={`Discount for ${product.nameEnglish}`}
        value={draft ?? String(current)}
        disabled={saving}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
          if (e.key === 'Escape') {
            setDraft(null);
            e.currentTarget.blur();
          }
        }}
        className={cn('h-8 pr-6 text-right tabular-nums', current > 0 && 'border-emerald-500/40')}
      />
      <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
    </div>
  );
}

