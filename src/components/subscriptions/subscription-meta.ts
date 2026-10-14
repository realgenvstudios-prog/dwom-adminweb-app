import type { Subscription, SubscriptionBilling } from '../../services/subscriptionsService';

export const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export const STATUSES = [
  { value: 'active', label: 'Active', className: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700' },
  { value: 'paused', label: 'Paused', className: 'border-amber-500/20 bg-amber-500/10 text-amber-700' },
  { value: 'cancelled', label: 'Cancelled', className: 'border-zinc-500/20 bg-zinc-500/10 text-zinc-600' },
];
export const statusOf = (v: string) => STATUSES.find((s) => s.value === v) ?? { value: v, label: v, className: '' };

export const FREQUENCIES = [
  { value: 'weekly', label: 'Weekly', perMonth: 4.33 },
  { value: 'biweekly', label: 'Every 2 weeks', perMonth: 2.17 },
  { value: 'monthly', label: 'Monthly', perMonth: 1 },
];
export const frequencyLabel = (v: string) => FREQUENCIES.find((f) => f.value === v)?.label ?? v;

/** One delivery's value: items × the unit price locked in on the subscription. */
export const basketValue = (s: Subscription) => (s.SubscriptionItem ?? []).reduce((t, i) => t + num(i.unitPrice) * i.quantity, 0);

/** Monthly value, with the same factors the backend uses for MRR. */
export const monthlyValue = (s: Subscription) => basketValue(s) * (FREQUENCIES.find((f) => f.value === s.frequency)?.perMonth ?? 1);

export const latestBilling = (s: Subscription): SubscriptionBilling | undefined => s.SubscriptionBilling?.[0];

/** An active subscription whose most recent charge failed or is waiting to be retried. */
export const paymentFailing = (s: Subscription) => s.status === 'active' && ['failed', 'pending_retry'].includes(latestBilling(s)?.status ?? '');

export const BILLING_STATUS: Record<string, { label: string; className: string }> = {
  charged: { label: 'Paid', className: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700' },
  pending: { label: 'Processing', className: 'border-sky-500/20 bg-sky-500/10 text-sky-700' },
  pending_retry: { label: 'Retrying', className: 'border-amber-500/20 bg-amber-500/10 text-amber-700' },
  failed: { label: 'Failed', className: 'border-red-500/20 bg-red-500/10 text-red-700' },
};

export const basketSummary = (s: Subscription) => {
  const names = (s.SubscriptionItem ?? [])
    .map((i) => {
      const opts = Array.isArray(i.selectedVariations) ? i.selectedVariations.map((v) => v?.label).filter(Boolean).join(' · ') : '';
      return i.Product?.nameEnglish ? (opts ? `${i.Product.nameEnglish} (${opts})` : i.Product.nameEnglish) : undefined;
    })
    .filter(Boolean) as string[];
  if (names.length === 0) return 'No items';
  return names.length <= 2 ? names.join(', ') : `${names.slice(0, 2).join(', ')} +${names.length - 2} more`;
};

export const customerName = (s: Subscription) => s.User?.name || s.User?.phoneNumber || `Customer #${s.userId}`;

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export function scheduleLabel(s: Subscription): string {
  if (s.frequency === 'monthly' && s.dayOfMonth) return `Monthly, on day ${s.dayOfMonth}`;
  if (s.frequency === 'weekly' && s.dayOfWeek != null && WEEKDAYS[s.dayOfWeek]) return `${frequencyLabel(s.frequency)}, on ${WEEKDAYS[s.dayOfWeek]}s`;
  return frequencyLabel(s.frequency);
}
