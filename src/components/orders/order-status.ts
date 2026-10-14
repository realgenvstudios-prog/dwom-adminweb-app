import {
  Banknote,
  Bike,
  CircleCheck,
  CircleX,
  CreditCard,
  MapPin,
  Package,
  PackageCheck,
  Smartphone,
  type LucideIcon,
} from 'lucide-react';

// One source of truth for how order/payment states are labelled, coloured,
// and iconed across the Orders table, filters, and details sheet.

export interface StatusMeta {
  value: string;
  label: string;
  icon: LucideIcon;
  /** Text color for the icon/label. */
  tone: string;
}

export const ORDER_STATUSES: StatusMeta[] = [
  { value: 'sorting', label: 'Sorting', icon: Package, tone: 'text-sky-600' },
  { value: 'ready', label: 'Ready', icon: PackageCheck, tone: 'text-amber-600' },
  { value: 'rider on the way', label: 'On the way', icon: Bike, tone: 'text-violet-600' },
  { value: 'rider has arrived', label: 'Rider arrived', icon: MapPin, tone: 'text-orange-600' },
  { value: 'delivered', label: 'Delivered', icon: CircleCheck, tone: 'text-emerald-600' },
  { value: 'cancelled', label: 'Cancelled', icon: CircleX, tone: 'text-red-600' },
];

export interface PaymentMeta {
  value: string;
  label: string;
  /** Soft badge background + text. */
  badge: string;
}

export const PAYMENT_STATUSES: PaymentMeta[] = [
  { value: 'paid', label: 'Paid', badge: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' },
  { value: 'pending', label: 'Pending', badge: 'bg-amber-500/10 text-amber-700 border-amber-500/20' },
  { value: 'failed', label: 'Failed', badge: 'bg-red-500/10 text-red-700 border-red-500/20' },
  { value: 'cancelled', label: 'Cancelled', badge: 'bg-muted text-muted-foreground border-border' },
];

export const PAYMENT_METHODS: { value: string; label: string; icon: LucideIcon }[] = [
  { value: 'card', label: 'Card', icon: CreditCard },
  { value: 'momo', label: 'Mobile Money', icon: Smartphone },
  { value: 'cash', label: 'Cash', icon: Banknote },
];

export function orderStatusMeta(value: string): StatusMeta {
  return ORDER_STATUSES.find((s) => s.value === value) ?? { value, label: value, icon: Package, tone: 'text-muted-foreground' };
}

export function paymentStatusMeta(value: string): PaymentMeta {
  return PAYMENT_STATUSES.find((s) => s.value === value) ?? { value, label: value, badge: 'bg-muted text-muted-foreground border-border' };
}

export function paymentMethodMeta(value: string) {
  return PAYMENT_METHODS.find((m) => m.value === value) ?? PAYMENT_METHODS[2];
}

// Backend still has some legacy rows ('on_the_way', 'arrived') from before
// the status rename; the backend accepts both, the UI shows one.
export function normalizeOrderStatus(status: string | null | undefined): string {
  const legacy: Record<string, string> = { on_the_way: 'rider on the way', arrived: 'rider has arrived' };
  const s = (status ?? '').trim().toLowerCase() || 'sorting';
  return legacy[s] ?? s;
}

// Backend stores a successful payment as 'completed'; the UI calls it 'paid'.
export function normalizePaymentStatus(status: string | null | undefined): string {
  const s = (status ?? '').trim().toLowerCase() || 'pending';
  return s === 'completed' ? 'paid' : s;
}

export function formatGhs(amount: number | null | undefined): string {
  return `GH₵ ${(amount ?? 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
