import type { Product } from './ProductTypes';
import { categoryNameOf, discountOf, num, priceOf, salePrice, stockMeta } from './product-meta';

// Fields the API sends that the Product type doesn't list.
type RawProduct = Product & {
  standardCost?: number | string | null;
  createdAt?: string;
  VariationGroup?: Array<{
    name?: string;
    options?: Array<{ label?: string; priceMultiplier?: number | string | null; extraCharge?: number | string | null }>;
  }>;
};

// A cell starting with = + - @ would run as a formula in Excel/Sheets.
function cell(v: string | number | null | undefined): string {
  let s = v == null ? '' : String(v);
  if (typeof v === 'string' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const money = (n: number) => n.toFixed(2);

/** "Size: Half ×0.5, Full ×1; Preparation: Cut +GH₵0.50" */
function variationsOf(p: RawProduct): string {
  return (p.VariationGroup ?? [])
    .map((g) => {
      const opts = (g.options ?? []).map((o) => {
        const parts = [o.label ?? ''];
        if (o.priceMultiplier != null && num(o.priceMultiplier) !== 1) parts.push(`×${num(o.priceMultiplier)}`);
        if (num(o.extraCharge) > 0) parts.push(`+GH₵${money(num(o.extraCharge))}`);
        return parts.join(' ');
      });
      return `${g.name ?? 'Options'}: ${opts.join(', ')}`;
    })
    .join('; ');
}

/** Downloads the given products as a spreadsheet (CSV, opens in Excel and Google Sheets). */
export function downloadProductsCsv(products: Product[], categories: { id: string; name: string }[]) {
  const header = [
    'ID',
    'Product',
    'Local name',
    'French name',
    'Category',
    'Unit',
    'Price (GHS)',
    'Discount %',
    'Sale price (GHS)',
    'Cost (GHS)',
    'Margin %',
    'In the shop',
    'Seasonal',
    'Variations',
    'Description',
    'Image link',
    'Added',
  ];
  const rows = (products as RawProduct[]).map((p) => {
    const sale = salePrice(p);
    const cost = p.standardCost != null && p.standardCost !== '' ? num(p.standardCost) : null;
    return [
      p.id,
      p.nameEnglish,
      p.nameLocal,
      p.nameFrench ?? '',
      categoryNameOf(p, categories),
      p.unitType,
      money(priceOf(p)),
      discountOf(p) || '',
      money(sale),
      cost == null ? '' : money(cost),
      cost == null || sale <= 0 ? '' : (((sale - cost) / sale) * 100).toFixed(1),
      stockMeta(p.stockStatus).label,
      p.seasonal ? 'Yes' : 'No',
      variationsOf(p),
      p.description ?? '',
      p.imageUrl ?? '',
      p.createdAt ? p.createdAt.slice(0, 10) : '',
    ];
  });
  const csv = [header, ...rows].map((r) => r.map(cell).join(',')).join('\r\n');
  // BOM so Excel reads local-language names (e.g. "Abɛ") correctly.
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `dwom-products-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
