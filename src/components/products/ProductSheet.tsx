import { useState } from 'react';
import { Archive, ImageOff, Loader2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import productsService from '../../services/productsService';
import { logger } from '../../utils/logger';
import { formatGhs } from '../orders/order-status';
import ProductFormFields from './ProductFormFields';
import { productToForm, validateProductForm, type ProductFormErrors, type ProductFormValues } from './product-form';
import { categoryNameOf, discountOf, priceOf, salePrice, stockMeta } from './product-meta';
import type { Product, ProductCategory } from './ProductTypes';

export type ProductSheetIntent = 'view' | 'edit' | 'archive';

interface ProductSheetProps {
  product: Product;
  /** What the user asked for. Mount with a fresh `key` per request. */
  intent: ProductSheetIntent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: ProductCategory[];
  onSaved: () => void;
  onArchived: () => void;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-2.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}

export default function ProductSheet({ product, intent, open, onOpenChange, categories, onSaved, onArchived }: ProductSheetProps) {
  const [editing, setEditing] = useState(intent === 'edit');
  const [form, setForm] = useState<ProductFormValues | null>(() => (intent === 'edit' ? productToForm(product) : null));
  const [errors, setErrors] = useState<ProductFormErrors>({});
  const [saving, setSaving] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(intent === 'archive');
  const [archiving, setArchiving] = useState(false);

  const id = Number.parseInt(String(product.id), 10);
  const stock = stockMeta(product.stockStatus);
  const discount = discountOf(product);
  const variations = productToForm(product).variationGroups;

  const startEdit = () => {
    setForm(productToForm(product));
    setErrors({});
    setEditing(true);
  };

  const save = async () => {
    if (!form) return;
    const errs = validateProductForm(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    try {
      setSaving(true);
      await productsService.update(id, {
        nameEnglish: form.nameEnglish.trim(),
        nameFrench: form.nameFrench.trim() || undefined,
        nameLocal: form.nameLocal.trim(),
        pricePerUnit: Number.parseFloat(form.price),
        unitType: form.unitType,
        description: form.description.trim() || undefined,
        imageUrl: form.imageUrl || undefined,
        categoryId: Number.parseInt(form.categoryId, 10),
        showPreparationOptions: form.showPreparationOptions,
        variationGroups: form.variationGroups,
      });

      toast.success(`${form.nameEnglish.trim()} saved`);
      setEditing(false);
      onSaved();
    } catch (err) {
      logger.error('❌ [ProductSheet] Failed to update product:', err);
      toast.error(`Couldn't save the product. ${err instanceof Error ? err.message : ''}`.trim());
    } finally {
      setSaving(false);
    }
  };

  const archive = async () => {
    try {
      setArchiving(true);
      await productsService.delete(id);
      toast.success(`${product.nameEnglish} archived`);
      onOpenChange(false);
      onArchived();
    } catch (err) {
      logger.error('❌ [ProductSheet] Failed to archive product:', err);
      toast.error(`Couldn't archive the product. ${err instanceof Error ? err.message : ''}`.trim());
    } finally {
      setArchiving(false);
      setConfirmArchive(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="flex flex-col gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-2xl">
          <SheetHeader className="border-b p-6 pb-4">
            <div className="flex items-start gap-4 pr-8">
              <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt="" className="size-full object-cover" />
                ) : (
                  <ImageOff className="size-5 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 space-y-1">
                <SheetTitle className="text-xl">{editing ? `Edit ${product.nameEnglish}` : product.nameEnglish}</SheetTitle>
                <SheetDescription>
                  {[product.nameLocal, product.nameFrench].filter(Boolean).join(' · ') || 'No local or French name'}
                </SheetDescription>
                {!editing && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <Badge variant="outline" className={cn('gap-1 font-medium', stock.badge)}>
                      <stock.icon className="size-3" />
                      {stock.label}
                    </Badge>
                    {product.seasonal && <Badge variant="secondary">Seasonal</Badge>}
                    {discount > 0 && <Badge variant="secondary">{discount}% off</Badge>}
                  </div>
                )}
              </div>
            </div>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto p-6">
            {editing && form ? (
              <ProductFormFields
                value={form}
                onChange={(patch) => setForm((f) => (f ? { ...f, ...patch } : f))}
                errors={errors}
                categories={categories}
                warehouseHint=""
                showWarehouseCount={false}
              />
            ) : (
              <div className="grid gap-6">
                <dl className="divide-y rounded-lg border">
                  <Row label="Category">{categoryNameOf(product, categories) || 'None'}</Row>
                  <Row label="Price">
                    {discount > 0 ? (
                      <span className="tabular-nums">
                        <span className="mr-2 text-muted-foreground line-through">{formatGhs(priceOf(product))}</span>
                        {formatGhs(salePrice(product))}
                      </span>
                    ) : (
                      <span className="tabular-nums">{formatGhs(priceOf(product))}</span>
                    )}
                    <span className="text-muted-foreground"> / {product.unitType}</span>
                  </Row>
                  <Row label="Warehouse count">
                    <span className="tabular-nums">
                      {product.inventory?.quantity ?? 0} {product.unitType}
                    </span>
                  </Row>
                </dl>

                {product.description && (
                  <section className="grid gap-2">
                    <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Description</h3>
                    <p className="text-sm leading-relaxed">{product.description}</p>
                  </section>
                )}

                <section className="grid gap-2">
                  <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Variations</h3>
                  {variations.length === 0 ? (
                    <p className="text-sm text-muted-foreground">None. Sold at the base price.</p>
                  ) : (
                    <div className="grid gap-3">
                      {variations.map((g) => (
                        <div key={g.type} className="rounded-lg border p-3">
                          <p className="mb-2 text-sm font-medium">{g.name}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {g.options.map((o, i) => (
                              <Badge key={i} variant={o.isDefault ? 'default' : 'outline'} className="font-normal">
                                {o.label}
                                {g.type === 'preparation'
                                  ? o.extraCharge
                                    ? ` · +${formatGhs(o.extraCharge)}`
                                    : ''
                                  : ` · ${formatGhs(priceOf(product) * (o.priceMultiplier ?? 1))}`}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>

          <SheetFooter className="flex-row justify-between border-t p-4">
            {editing ? (
              <>
                <Button variant="outline" onClick={() => setEditing(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={save} disabled={saving}>
                  {saving && <Loader2 className="animate-spin" />}
                  Save changes
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setConfirmArchive(true)}>
                  <Archive />
                  Archive
                </Button>
                <Button onClick={startEdit}>
                  <Pencil />
                  Edit product
                </Button>
              </>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmArchive} onOpenChange={setConfirmArchive}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive {product.nameEnglish}?</AlertDialogTitle>
            <AlertDialogDescription>
              Customers will no longer see it in the app, and it will disappear from this list. Past orders keep it.
              You can restore it later from Products → Archived.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={archiving}>Keep product</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={archive} disabled={archiving}>
              {archiving && <Loader2 className="animate-spin" />}
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
