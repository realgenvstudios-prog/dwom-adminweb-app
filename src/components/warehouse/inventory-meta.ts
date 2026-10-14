import { ArrowDownLeft, ArrowUpRight, CircleCheck, CircleX, TriangleAlert, type LucideIcon } from 'lucide-react';
import type { MovementRecord } from '../../services/inventoryService';

/** One row of GET /inventory: the Inventory record + its product and movements. */
export interface InventoryRow {
  id: number;
  productId: number;
  quantity: number;
  reorderLevel: number;
  reorderQuantity: number;
  lastRestockedAt: string | null;
  updatedAt: string;
  Product?: {
    id: number;
    nameEnglish: string;
    imageUrl?: string | null;
    unitType?: string;
    active?: boolean;
    Category?: { id: number; name: string } | null;
  };
  InventoryMovement?: MovementRecord[];
}

export type LevelKey = 'ok' | 'reorder' | 'empty';

// Same rule as the API's stats: at or below the reorder level needs reordering.
export const LEVELS: Record<LevelKey, { label: string; icon: LucideIcon; tone: string; badge: string }> = {
  ok: { label: 'Stocked', icon: CircleCheck, tone: 'text-emerald-600', badge: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' },
  reorder: { label: 'Reorder', icon: TriangleAlert, tone: 'text-amber-600', badge: 'bg-amber-500/10 text-amber-700 border-amber-500/20' },
  empty: { label: 'Empty', icon: CircleX, tone: 'text-red-600', badge: 'bg-red-500/10 text-red-700 border-red-500/20' },
};

export function levelOf(row: Pick<InventoryRow, 'quantity' | 'reorderLevel'>): LevelKey {
  if (row.quantity <= 0) return 'empty';
  if (row.quantity <= row.reorderLevel) return 'reorder';
  return 'ok';
}

// Movement types the API accepts, and which way each moves the count.
export const MOVEMENTS: { value: 'incoming' | 'return' | 'adjustment' | 'orders' | 'wastage' | 'damaged'; label: string; adds: boolean }[] = [
  { value: 'incoming', label: 'Received from supplier', adds: true },
  { value: 'return', label: 'Customer return', adds: true },
  { value: 'adjustment', label: 'Count correction (found extra)', adds: true },
  { value: 'orders', label: 'Used for orders', adds: false },
  { value: 'wastage', label: 'Spoiled / thrown away', adds: false },
  { value: 'damaged', label: 'Damaged', adds: false },
];

export function movementMeta(type: string): { label: string; adds: boolean; icon: LucideIcon; tone: string } {
  const m = MOVEMENTS.find((x) => x.value === type);
  const adds = m?.adds ?? true;
  return { label: m?.label ?? type, adds, icon: adds ? ArrowDownLeft : ArrowUpRight, tone: adds ? 'text-emerald-600' : 'text-red-600' };
}
