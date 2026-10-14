import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import ImageUpload from '../common/ImageUpload';
import VariationGroupsEditor from './VariationGroupsEditor';
import type { ProductFormErrors, ProductFormValues } from './product-form';
import { UNIT_TYPES } from './product-meta';
import type { ProductCategory } from './ProductTypes';

function Field({ id, label, error, hint, children, className }: { id: string; label: string; error?: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('grid gap-1.5', className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

interface ProductFormFieldsProps {
  value: ProductFormValues;
  onChange: (patch: Partial<ProductFormValues>) => void;
  errors: ProductFormErrors;
  categories: ProductCategory[];
  warehouseHint: string;
  /** Edits go through Warehouse movements instead, so this is create-only. */
  showWarehouseCount?: boolean;
}

export default function ProductFormFields({ value, onChange, errors, categories, warehouseHint, showWarehouseCount = true }: ProductFormFieldsProps) {
  const units = UNIT_TYPES.includes(value.unitType) || !value.unitType ? UNIT_TYPES : [value.unitType, ...UNIT_TYPES];
  const invalid = (k: keyof ProductFormValues) => (errors[k] ? true : undefined);

  return (
    <div className="grid gap-6">
      <section className="grid gap-4">
        <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Basics</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="pf-en" label="Name (English)" error={errors.nameEnglish}>
            <Input id="pf-en" value={value.nameEnglish} aria-invalid={invalid('nameEnglish')} onChange={(e) => onChange({ nameEnglish: e.target.value })} placeholder="e.g. Tomatoes" />
          </Field>
          <Field id="pf-local" label="Name (local)" error={errors.nameLocal}>
            <Input id="pf-local" value={value.nameLocal} aria-invalid={invalid('nameLocal')} onChange={(e) => onChange({ nameLocal: e.target.value })} placeholder="e.g. Ntoosi" />
          </Field>
          <Field id="pf-fr" label="Name (French)" hint="Optional">
            <Input id="pf-fr" value={value.nameFrench} onChange={(e) => onChange({ nameFrench: e.target.value })} placeholder="e.g. Tomates" />
          </Field>
          <Field id="pf-cat" label="Category" error={errors.categoryId}>
            <Select value={value.categoryId} onValueChange={(v) => onChange({ categoryId: v })}>
              <SelectTrigger id="pf-cat" className="w-full" aria-invalid={invalid('categoryId')}>
                <SelectValue placeholder={categories.length ? 'Choose a category' : 'No categories yet'} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </section>

      <Separator />

      <section className="grid gap-4">
        <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Pricing</h3>
        <div className={cn('grid gap-4', showWarehouseCount ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}>
          <Field id="pf-price" label="Price per unit (GH₵)" error={errors.price}>
            <Input
              id="pf-price"
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              value={value.price}
              aria-invalid={invalid('price')}
              onChange={(e) => onChange({ price: e.target.value })}
              placeholder="12.50"
            />
          </Field>
          <Field id="pf-unit" label="Sold per">
            <Select value={value.unitType} onValueChange={(v) => onChange({ unitType: v })}>
              <SelectTrigger id="pf-unit" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {units.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {showWarehouseCount && (
          <Field id="pf-qty" label="Warehouse count" hint={warehouseHint}>
            <Input
              id="pf-qty"
              type="number"
              step="1"
              min="0"
              inputMode="numeric"
              value={value.warehouseQty}
              onChange={(e) => onChange({ warehouseQty: e.target.value })}
              placeholder="0"
            />
          </Field>
          )}
        </div>
      </section>

      <Separator />

      <section className="grid gap-4">
        <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Details</h3>
        <Field id="pf-desc" label="Description" hint="Optional — shown on the product page in the app.">
          <Textarea id="pf-desc" rows={3} value={value.description} onChange={(e) => onChange({ description: e.target.value })} />
        </Field>
        <ImageUpload label="Photo" value={value.imageUrl} onChange={(url) => onChange({ imageUrl: url })} />
      </section>

      <Separator />

      <VariationGroupsEditor
        groups={value.variationGroups}
        onChange={(variationGroups) => onChange({ variationGroups })}
        showPreparationOptions={value.showPreparationOptions}
        onShowPrepChange={(showPreparationOptions) => onChange({ showPreparationOptions })}
        basePrice={Number.parseFloat(value.price) || 0}
      />
    </div>
  );
}
