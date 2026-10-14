import type { VariationGroup } from './VariationGroupsEditor';
import type { Product } from './ProductTypes';
import { categoryIdOf, priceOf } from './product-meta';

export interface ProductFormValues {
  nameEnglish: string;
  nameLocal: string;
  nameFrench: string;
  categoryId: string;
  price: string;
  unitType: string;
  warehouseQty: string;
  description: string;
  imageUrl: string;
  variationGroups: VariationGroup[];
  showPreparationOptions: boolean;
}

export const EMPTY_PRODUCT_FORM: ProductFormValues = {
  nameEnglish: '',
  nameLocal: '',
  nameFrench: '',
  categoryId: '',
  price: '',
  unitType: 'Kg',
  warehouseQty: '',
  description: '',
  imageUrl: '',
  variationGroups: [],
  showPreparationOptions: false,
};

export type ProductFormErrors = Partial<Record<keyof ProductFormValues, string>>;

export function validateProductForm(v: ProductFormValues): ProductFormErrors {
  const e: ProductFormErrors = {};
  if (!v.nameEnglish.trim()) e.nameEnglish = 'Enter the English name';
  if (!v.nameLocal.trim()) e.nameLocal = 'Enter the local name';
  if (!v.categoryId) e.categoryId = 'Choose a category';
  if (!(Number.parseFloat(v.price) > 0)) e.price = 'Enter a price above 0';
  return e;
}


interface ProductWithExtras extends Product {
  VariationGroup?: Array<{
    name: string;
    nameFrench?: string | null;
    type: VariationGroup['type'];
    required?: boolean;
    sortOrder?: number;
    options?: Array<{ label: string; labelFrench?: string | null; priceMultiplier?: number; extraCharge?: number | null; isDefault?: boolean; sortOrder?: number }>;
  }>;
  showPreparationOptions?: boolean;
}

/** Load an existing product into the form. */
export function productToForm(p: Product): ProductFormValues {
  const x = p as ProductWithExtras;
  return {
    nameEnglish: p.nameEnglish ?? '',
    nameLocal: p.nameLocal ?? '',
    nameFrench: p.nameFrench ?? '',
    categoryId: categoryIdOf(p),
    price: String(priceOf(p) || ''),
    unitType: p.unitType || 'Kg',
    warehouseQty: String(p.inventory?.quantity ?? 0),
    description: p.description ?? '',
    imageUrl: p.imageUrl ?? '',
    showPreparationOptions: x.showPreparationOptions ?? false,
    variationGroups: (x.VariationGroup ?? []).map((g) => ({
      name: g.name,
      nameFrench: g.nameFrench ?? '',
      type: g.type,
      required: g.required,
      sortOrder: g.sortOrder,
      options: (g.options ?? []).map((o) => ({
        label: o.label,
        labelFrench: o.labelFrench ?? '',
        priceMultiplier: o.priceMultiplier,
        extraCharge: o.extraCharge ?? 0,
        isDefault: o.isDefault ?? false,
        sortOrder: o.sortOrder,
      })),
    })),
  };
}
