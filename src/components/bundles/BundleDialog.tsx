import { useMemo, useState } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import bundlesService, { type Bundle } from '../../services/bundlesService';
import { logger } from '../../utils/logger';
import ImageUpload from '../common/ImageUpload';
import { formatGhs } from '../orders/order-status';
import type { Product, ProductCategory } from '../products/ProductTypes';
import BundleProductPicker from './BundleProductPicker';
import { bundleTotals, storedUnitPrices, type BundleLine } from './bundle-pricing';

interface BundleDialogProps {
  /** null = create. Mount with a fresh `key` per open so the form starts clean. */
  bundle: Bundle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  categories: ProductCategory[];
  onSaved: () => void;
}

export default function BundleDialog({ bundle, open, onOpenChange, products, categories, onSaved }: BundleDialogProps) {
  const [name, setName] = useState(bundle?.name ?? '');
  const [description, setDescription] = useState(bundle?.description ?? '');
  const [discount, setDiscount] = useState(String(Number(bundle?.discount ?? 0)));
  const [imageUrl, setImageUrl] = useState(bundle?.imageUrl ?? '');
  const [lines, setLines] = useState<BundleLine[]>(() =>
    (bundle?.BundleItem ?? bundle?.items ?? []).map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      visibleVariationOptionIds: i.visibleVariationOptionIds,
    })),
  );
  const [problem, setProblem] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const stored = useMemo(() => storedUnitPrices(bundle), [bundle]);
  const pct = Math.min(100, Math.max(0, Number.parseFloat(discount) || 0));
  const totals = bundleTotals(lines, products, pct, stored);
  const byId = new Map(products.map((p) => [Number(p.id), p]));
  const nameOf = (id: number) => byId.get(id)?.nameEnglish ?? bundle?.BundleItem?.find((i) => i.productId === id)?.productName ?? `Product #${id}`;

  const toggle = (productId: number) =>
    setLines((ls) => (ls.some((l) => l.productId === productId) ? ls.filter((l) => l.productId !== productId) : [...ls, { productId, quantity: 1 }]));
  const setQuantity = (productId: number, quantity: number) =>
    setLines((ls) => ls.map((l) => (l.productId === productId ? { ...l, quantity: Math.max(1, quantity) } : l)));
  // An empty list means "every option visible"; toggling makes it explicit.
  const toggleOption = (productId: number, optionId: number, all: number[]) =>
    setLines((ls) =>
      ls.map((l) => {
        if (l.productId !== productId) return l;
        const current = l.visibleVariationOptionIds?.length ? l.visibleVariationOptionIds : all;
        return { ...l, visibleVariationOptionIds: current.includes(optionId) ? current.filter((x) => x !== optionId) : [...current, optionId] };
      }),
    );

  const save = async () => {
    if (!name.trim()) return setProblem('Give the bundle a name.');
    if (lines.length === 0) return setProblem('Add at least one product.');
    if (totals.final <= 0) return setProblem('The bundle price must be above zero — add products or lower the discount.');
    setProblem(null);
    const price = Number.parseFloat(totals.final.toFixed(2));
    try {
      setSaving(true);
      if (bundle) {
        // Send 0 / empty strings so removing a discount or clearing a field sticks.
        await bundlesService.update(bundle.id, {
          name: name.trim(),
          description: description.trim(),
          price,
          discount: pct,
          imageUrl: imageUrl.trim(),
          items: lines,
        });
        toast.success(`${name.trim()} saved`);
      } else {
        await bundlesService.create({
          name: name.trim(),
          description: description.trim() || undefined,
          price,
          discount: pct || undefined,
          imageUrl: imageUrl.trim() || undefined,
          items: lines,
        });
        toast.success(`${name.trim()} created`);
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      logger.error('❌ [BundleDialog] Failed to save bundle:', err);
      toast.error(`Couldn't save the bundle. ${err instanceof Error ? err.message : ''}`.trim());
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] flex-col gap-0 p-0 sm:max-w-5xl">
        <DialogHeader className="border-b p-6 pb-4">
          <DialogTitle>{bundle ? `Edit ${bundle.name}` : 'New bundle'}</DialogTitle>
          <DialogDescription>Pick products and quantities; the price is their total minus the bundle discount.</DialogDescription>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 gap-6 overflow-y-auto p-6 lg:grid-cols-[1fr_1.1fr] lg:overflow-hidden">
          <div className="grid content-start gap-4 lg:overflow-y-auto lg:pr-1">
            <div className="grid gap-1.5">
              <Label htmlFor="b-name">Name</Label>
              <Input id="b-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Breakfast bundle" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="b-desc">Description</Label>
              <Textarea id="b-desc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="b-disc">Bundle discount</Label>
              <div className="relative w-32">
                <Input id="b-disc" type="number" min={0} max={100} step={0.5} value={discount} onChange={(e) => setDiscount(e.target.value)} className="pr-7 tabular-nums" />
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">%</span>
              </div>
            </div>
            <ImageUpload label="Photo" value={imageUrl} onChange={setImageUrl} />

            <section className="grid gap-2">
              <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">In this bundle ({lines.length})</h3>
              {lines.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">Pick products from the list.</p>
              ) : (
                <ul className="divide-y rounded-lg border">
                  {lines.map((l) => {
                    const archived = totals.unavailable.includes(l.productId);
                    return (
                      <li key={l.productId} className="flex items-center gap-2 px-3 py-2 text-sm">
                        <span className="w-8 text-muted-foreground tabular-nums">{l.quantity}×</span>
                        <span className="min-w-0 flex-1 truncate">{nameOf(l.productId)}</span>
                        {archived && <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-700">Archived</Badge>}
                        <Button type="button" variant="ghost" size="icon-xs" onClick={() => toggle(l.productId)} aria-label={`Remove ${nameOf(l.productId)}`}>
                          <X />
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              )}
              {totals.unavailable.length > 0 && (
                <p className="flex items-start gap-2 rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-800">
                  <AlertTriangle className="mt-px size-3.5 shrink-0" />
                  Archived products still count at their last listed price, but customers can’t buy them on their own anymore — consider removing them.
                </p>
              )}
            </section>

            <dl className="grid gap-1.5 rounded-lg border bg-muted/30 p-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Products total</dt>
                <dd className="tabular-nums">{formatGhs(totals.original)}</dd>
              </div>
              {pct > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <dt>Discount ({pct}%)</dt>
                  <dd className="tabular-nums">−{formatGhs(totals.savings)}</dd>
                </div>
              )}
              <div className="mt-1 flex justify-between border-t pt-2 text-base font-semibold">
                <dt>Bundle price</dt>
                <dd className="tabular-nums">{formatGhs(totals.final)}</dd>
              </div>
            </dl>
          </div>

          <div className="flex min-h-[360px] flex-col lg:min-h-0">
            <BundleProductPicker
              products={products}
              categories={categories}
              lines={lines}
              onToggle={toggle}
              onQuantity={setQuantity}
              onToggleOption={toggleOption}
            />
          </div>
        </div>

        <DialogFooter className="items-center border-t p-4">
          {problem && <p className="mr-auto text-sm text-destructive">{problem}</p>}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void save()} disabled={saving}>
            {saving && <Loader2 className="animate-spin" />}
            {bundle ? 'Save changes' : 'Create bundle'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
