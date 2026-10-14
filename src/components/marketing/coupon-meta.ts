import type { Coupon } from '../../services/couponService';
import { formatGhs } from '../orders/order-status';
import { num } from './campaign-meta';

export type CouponState = 'active' | 'paused' | 'expired' | 'used_up';

export const COUPON_STATES: {
  value: CouponState;
  label: string;
  className: string;
}[] = [
  {
    value: 'active',
    label: 'Active',
    className: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700',
  },
  {
    value: 'paused',
    label: 'Paused',
    className: 'border-amber-500/20 bg-amber-500/10 text-amber-700',
  },
  {
    value: 'expired',
    label: 'Expired',
    className: 'border-zinc-500/20 bg-zinc-500/10 text-zinc-600',
  },
  {
    value: 'used_up',
    label: 'Used up',
    className: 'border-zinc-500/20 bg-zinc-500/10 text-zinc-600',
  },
];

/** What a customer would experience typing this code right now (mirrors the checkout validation order). */
export function couponState(c: Coupon, now = Date.now()): CouponState {
  if (!c.active) return 'paused';
  if (c.expiresAt && new Date(c.expiresAt).getTime() < now) return 'expired';
  if (c.maxUses != null && c.usageCount >= c.maxUses) return 'used_up';
  return 'active';
}

export const stateOf = (s: CouponState) => COUPON_STATES.find((x) => x.value === s)!;

export function discountLabel(c: Pick<Coupon, 'discountType' | 'discountValue'>): string {
  const v = num(c.discountValue);
  return c.discountType === 'percentage' ? `${v}% off` : `${formatGhs(v)} off`;
}

/** Codes are stored upper-case; keep only characters that are easy to read out and type. */
export const normalizeCode = (s: string) => s.toUpperCase().replace(/[^A-Z0-9_-]/g, '');

export function randomCode(prefix = 'DWOM'): string {
  // No 0/O/1/I so a code read aloud or off a flyer isn't mistyped.
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(5));
  return `${prefix}${Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')}`;
}
