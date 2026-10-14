// Shapes returned by /users/admin/customers and /users/admin/customers/:id/orders.

export type CustomerStatus = 'Active' | 'At Risk' | 'Churned' | 'New';

export interface Customer {
  id: number;
  name: string;
  email: string | null;
  phone: string;
  createdAt: string;
  /** The customer's first saved address (oldest by id). */
  address: string | null;
  totalOrders: number;
  /** Sum of paid orders only. */
  totalSpend: number;
  lastOrder: string | null;
  status: CustomerStatus;
}

export interface CustomerOrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  image: string | null;
}

export interface CustomerOrder {
  id: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  total: number;
  createdAt: string;
  address: string | null;
  items: CustomerOrderItem[];
}

// Backend (UsersService.getCustomersWithStats) buckets by days since the
// customer's most recent order of any kind.
export const CUSTOMER_STATUSES: { value: CustomerStatus; label: string; hint: string; badge: string; dot: string }[] = [
  { value: 'Active', label: 'Active', hint: 'Ordered in the last 30 days', badge: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20', dot: 'bg-emerald-500' },
  { value: 'At Risk', label: 'At risk', hint: 'Last order 31–90 days ago', badge: 'bg-amber-500/10 text-amber-700 border-amber-500/20', dot: 'bg-amber-500' },
  { value: 'Churned', label: 'Churned', hint: 'No order in over 90 days', badge: 'bg-red-500/10 text-red-700 border-red-500/20', dot: 'bg-red-500' },
  { value: 'New', label: 'Never ordered', hint: 'Signed up, no orders yet', badge: 'bg-sky-500/10 text-sky-700 border-sky-500/20', dot: 'bg-sky-500' },
];

export function customerStatusMeta(value: CustomerStatus) {
  return CUSTOMER_STATUSES.find((s) => s.value === value) ?? CUSTOMER_STATUSES[3];
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '—';
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (Number.isNaN(days)) return '—';
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
  const years = Math.floor(days / 365);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}
