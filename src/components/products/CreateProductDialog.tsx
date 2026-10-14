import { useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import productsService from '../../services/productsService';
import { logger } from '../../utils/logger';
import ProductFormFields from './ProductFormFields';
import { EMPTY_PRODUCT_FORM, validateProductForm, type ProductFormErrors, type ProductFormValues } from './product-form';
import type { ProductCategory } from './ProductTypes';

interface CreateProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: ProductCategory[];
  onCreated: () => void;
}

export default function CreateProductDialog({ open, onOpenChange, categories, onCreated }: CreateProductDialogProps) {
  const [form, setForm] = useState<ProductFormValues>(EMPTY_PRODUCT_FORM);
  const [errors, setErrors] = useState<ProductFormErrors>({});
  const [saving, setSaving] = useState<null | 'close' | 'again'>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  const dirty = JSON.stringify(form) !== JSON.stringify(EMPTY_PRODUCT_FORM);

  const reset = () => {
    setForm(EMPTY_PRODUCT_FORM);
    setErrors({});
  };

  const requestClose = (next: boolean) => {
    if (next) return onOpenChange(true);
    if (dirty && !saving) setConfirmDiscard(true);
    else {
      reset();
      onOpenChange(false);
    }
  };

  const submit = async (mode: 'close' | 'again') => {
    const errs = validateProductForm(form);
    setErrors(errs);
    if (Object.keys(errs).length) {
      bodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    try {
      setSaving(mode);
      await productsService.create({
        nameEnglish: form.nameEnglish.trim(),
        nameFrench: form.nameFrench.trim() || undefined,
        nameLocal: form.nameLocal.trim(),
        categoryId: Number.parseInt(form.categoryId, 10),
        pricePerUnit: Number.parseFloat(form.price),
        unitType: form.unitType,
        description: form.description.trim() || undefined,
        imageUrl: form.imageUrl || undefined,
        inventoryQuantity: Math.max(0, Number.parseInt(form.warehouseQty, 10) || 0),
        showPreparationOptions: form.showPreparationOptions,
        variationGroups: form.variationGroups.length ? form.variationGroups : undefined,
      });
      toast.success(`${form.nameEnglish.trim()} added to the catalog`);
      reset();
      onCreated();
      if (mode === 'close') onOpenChange(false);
      else bodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      logger.error('❌ [CreateProductDialog] Failed to create product:', err);
      toast.error(`Couldn't create the product. ${err instanceof Error ? err.message : ''}`.trim());
    } finally {
      setSaving(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={requestClose}>
        <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-2xl">
          <DialogHeader className="border-b p-6 pb-4">
            <DialogTitle>Add product</DialogTitle>
            <DialogDescription>New products are in stock and visible in the app as soon as you save.</DialogDescription>
          </DialogHeader>
          <div
            ref={bodyRef}
            className="min-h-0 flex-1 overflow-y-auto p-6"
            onKeyDown={(e) => {
              // Enter in a text field shouldn't submit a form this long.
              if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') e.preventDefault();
            }}
          >
            <ProductFormFields
              value={form}
              onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
              errors={errors}
              categories={categories}
              warehouseHint="Optional. Only if you track warehouse stock."
            />
          </div>
          <DialogFooter className="border-t p-4">
            <Button variant="outline" onClick={() => requestClose(false)} disabled={saving !== null}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={() => submit('again')} disabled={saving !== null}>
              {saving === 'again' && <Loader2 className="animate-spin" />}
              Save & add another
            </Button>
            <Button onClick={() => submit('close')} disabled={saving !== null}>
              {saving === 'close' && <Loader2 className="animate-spin" />}
              Add product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDiscard} onOpenChange={setConfirmDiscard}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard this product?</AlertDialogTitle>
            <AlertDialogDescription>What you’ve entered so far will be lost.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
