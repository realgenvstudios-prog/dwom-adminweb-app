import type { Bundle } from '../../services/bundlesService';
import type { Product } from '../products/ProductTypes';
import { priceOf } from '../products/product-meta';

export interface BundleLine {
  productId: number;
  quantity: number;
  visibleVariationOptionIds?: number[];
}

/**
 * Bundle price = (sum of each product's base price × qty) × (1 − bundle discount).
 * Products archived since the bundle was made aren't in the live catalog;
 * for those we fall back to the unitPrice the bundles API reports (the
 * product's current price), so an edit doesn't silently drop them from the total.
 */
export function bundleTotals(lines: BundleLine[], products: Product[], discountPct: number, storedUnitPrices: Map<number, number> = new Map()) {
  const byId = new Map(products.map((p) => [Number(p.id), p]));
  let original = 0;
  const unavailable: number[] = [];
  for (const line of lines) {
    const live = byId.get(line.productId);
    if (live) original += priceOf(live) * line.quantity;
    else {
      unavailable.push(line.productId);
      original += (storedUnitPrices.get(line.productId) ?? 0) * line.quantity;
    }
  }
  const pct = Math.min(100, Math.max(0, discountPct || 0));
  const final = original * (1 - pct / 100);
  return { original, final, savings: original - final, unavailable };
}

/** productId → unitPrice as reported on the bundle's items. */
export function storedUnitPrices(bundle: Bundle | null | undefined): Map<number, number> {
  return new Map((bundle?.BundleItem ?? []).map((i) => [i.productId, Number(i.unitPrice ?? 0)]));
}

/** True when today's product prices would give a different bundle price than the saved one. */
export function priceIsStale(bundle: Bundle, products: Product[]): boolean {
  const lines = (bundle.BundleItem ?? []).map((i) => ({ productId: i.productId, quantity: i.quantity }));
  if (lines.length === 0) return false;
  const { final } = bundleTotals(lines, products, Number(bundle.discount ?? 0), storedUnitPrices(bundle));
  return Math.abs(final - Number(bundle.price ?? 0)) >= 0.01;
}
