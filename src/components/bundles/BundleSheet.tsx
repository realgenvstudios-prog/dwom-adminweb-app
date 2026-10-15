import { AlertTriangle, ImageOff, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { Bundle } from '../../services/bundlesService';
import { formatGhs } from '../orders/order-status';
import type { Product } from '../products/ProductTypes';
import { bundleTotals, storedUnitPrices } from './bundle-pricing';
import { can } from '../../config/permissions';

interface BundleSheetProps {
  bundle: Bundle;
  products: Product[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function BundleSheet({ bundle, products, open, onOpenChange, onEdit, onDelete }: BundleSheetProps) {
  const items = bundle.BundleItem ?? [];
  const discount = Number(bundle.discount ?? 0);
  const price = Number(bundle.price ?? 0);
  const original = items.reduce((sum, i) => sum + Number(i.totalItemPrice ?? 0), 0);
  const current = bundleTotals(
    items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    products,
    discount,
    storedUnitPrices(bundle),
  );
  const stale = items.length > 0 && Math.abs(current.final - price) >= 0.01;
  const deactivated = bundle.active === false;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl">
        <div className="relative aspect-[16/9] shrink-0 bg-muted">
          {bundle.imageUrl ? (
            <img src={bundle.imageUrl} alt="" className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center">
              <ImageOff className="size-6 text-muted-foreground" />
            </div>
          )}
        </div>
        <SheetHeader className="gap-2 border-b p-6 pb-4">
          <div className="flex flex-wrap items-center gap-2 pr-8">
            <SheetTitle className="text-xl">{bundle.name}</SheetTitle>
            {deactivated && <Badge variant="secondary">Deactivated</Badge>}
          </div>
          {bundle.description && <SheetDescription>{bundle.description}</SheetDescription>}
          <div className="flex flex-wrap items-baseline gap-2 pt-1">
            <span className="text-2xl font-semibold tabular-nums">{formatGhs(price)}</span>
            {discount > 0 && original > price && <span className="text-sm text-muted-foreground line-through tabular-nums">{formatGhs(original)}</span>}
            {discount > 0 && <Badge className="bg-emerald-600 text-white dark:bg-emerald-500/20 dark:text-emerald-300">Save {discount}%</Badge>}
          </div>
        </SheetHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
          {stale && !deactivated && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <p>
                Product prices have changed since this bundle was priced. At today’s prices it would be <strong className="tabular-nums">{formatGhs(current.final)}</strong>. Open
                Edit and save to update it.
              </p>
            </div>
          )}

          <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Items ({items.length})</h3>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">This bundle has no items.</p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {items.map((item) => (
                <li key={item.id} className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
                      {item.productImage ? <img src={item.productImage} alt="" className="size-full object-cover" /> : <ImageOff className="size-4 text-muted-foreground" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.productName ?? `Product #${item.productId}`}</p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {item.quantity} × {formatGhs(Number(item.unitPrice ?? 0))}
                      </p>
                    </div>
                    <span className="text-sm font-medium tabular-nums">{formatGhs(Number(item.totalItemPrice ?? 0))}</span>
                  </div>
                  {(item.variationGroups ?? []).map((g) => {
                    const vis = item.visibleVariationOptionIds;
                    const options = g.options.filter((o) => !vis?.length || vis.includes(o.id));
                    if (options.length === 0) return null;
                    return (
                      <div key={g.id} className="mt-2 ml-13 flex flex-wrap items-center gap-1">
                        <span className="mr-1 text-xs text-muted-foreground">{g.name}</span>
                        {options.map((o) => (
                          <Badge key={o.id} variant={o.isDefault ? 'default' : 'outline'} className="font-normal">
                            {o.label}
                          </Badge>
                        ))}
                      </div>
                    );
                  })}
                </li>
              ))}
            </ul>
          )}
        </div>

        {!deactivated && (
          <SheetFooter className="flex-row justify-between border-t p-4">
            {can('bundles.delete') && (
              <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={onDelete}>
                <Trash2 />
                Delete
              </Button>
            )}
            {can('bundles.manage') && (
              <Button onClick={onEdit}>
                <Pencil />
                Edit bundle
              </Button>
            )}
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
