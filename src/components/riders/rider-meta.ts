import { Bike, Car, CircleDot, Coffee, Moon, Navigation, type LucideIcon } from 'lucide-react';

// Rider.status is normally set by the rider app; admins can override it.
export const RIDER_STATUSES: { value: string; label: string; icon: LucideIcon; tone: string; badge: string }[] = [
  { value: 'available', label: 'Available', icon: CircleDot, tone: 'text-emerald-600', badge: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' },
  { value: 'on_delivery', label: 'On delivery', icon: Navigation, tone: 'text-violet-600', badge: 'bg-violet-500/10 text-violet-700 border-violet-500/20' },
  { value: 'busy', label: 'Busy', icon: Coffee, tone: 'text-amber-600', badge: 'bg-amber-500/10 text-amber-700 border-amber-500/20' },
  { value: 'offline', label: 'Offline', icon: Moon, tone: 'text-muted-foreground', badge: 'bg-muted text-muted-foreground border-border' },
];

export function riderStatusMeta(value: string) {
  return RIDER_STATUSES.find((s) => s.value === value) ?? RIDER_STATUSES[3];
}

export const VEHICLES: { value: string; label: string; icon: LucideIcon }[] = [
  { value: 'motor', label: 'Motorbike', icon: Bike },
  { value: 'car', label: 'Car', icon: Car },
];

export function vehicleMeta(value: string) {
  return VEHICLES.find((v) => v.value === value?.toLowerCase()) ?? { value, label: value || '—', icon: Bike };
}

/** Prisma Decimals (e.g. totalEarnings) arrive as strings. */
export function num(v: unknown): number {
  const n = typeof v === 'string' ? Number.parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : 0;
}

export const NO_ZONE = 'none';
