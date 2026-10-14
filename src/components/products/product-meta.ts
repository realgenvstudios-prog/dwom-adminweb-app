import { CircleAlert, CircleCheck, CircleX, type LucideIcon } from 'lucide-react';
import type { Product } from './ProductTypes';

// Manual, admin-set availability (Product.stockStatus) — the real "can a
// customer buy this" signal. Inventory.quantity is a separate, dormant
// warehouse count and is not used here.
export interface StockMeta {
  value: string;
  label: string;
  icon: LucideIcon;
  tone: string;
  badge: string;
}

export const STOCK_STATUSES: StockMeta[] = [
  { value: 'in_stock', label: 'In stock', icon: CircleCheck, tone: 'text-emerald-600', badge: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' },
  { value: 'low_stock', label: 'Low stock', icon: CircleAlert, tone: 'text-amber-600', badge: 'bg-amber-500/10 text-amber-700 border-amber-500/20' },
  { value: 'out_of_stock', label: 'Out of stock', icon: CircleX, tone: 'text-red-600', badge: 'bg-red-500/10 text-red-700 border-red-500/20' },
];

export function stockMeta(value: string | undefined): StockMeta {
  return STOCK_STATUSES.find((s) => s.value === value) ?? STOCK_STATUSES[0];
}

export const UNIT_TYPES = ['Kg', 'Gm', 'Piece', 'Pack', 'Bunch', 'Jar', 'Bottle', 'Litre'];

/** Prisma Decimal/Float fields can arrive as strings. */
export function num(v: unknown): number {
  const n = typeof v === 'string' ? Number.parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function priceOf(p: Product): number {
  return num(p.pricePerUnit);
}

export function discountOf(p: Product): number {
  return num(p.discount);
}

/** What the customer pays per unit after the product's % discount. */
export function salePrice(p: Product): number {
  return priceOf(p) * (1 - discountOf(p) / 100);
}

export function categoryIdOf(p: Product): string {
  const raw = p as Product & { Category?: { id?: number } };
  return String(raw.categoryId ?? raw.Category?.id ?? '');
}

export function categoryNameOf(p: Product, categories: { id: string; name: string }[]): string {
  const raw = p as Product & { Category?: { name?: string } };
  return raw.Category?.name ?? p.category?.name ?? categories.find((c) => c.id === categoryIdOf(p))?.name ?? '';
}
