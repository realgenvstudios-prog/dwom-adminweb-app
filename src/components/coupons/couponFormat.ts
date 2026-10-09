import type { Coupon, CreateCouponPayload } from '../../services/couponService';

export const isExpired = (coupon: Coupon) =>
  coupon.expiresAt ? new Date(coupon.expiresAt) < new Date() : false;

export const formatDiscount = (c: Coupon) =>
  c.discountType === 'percentage' ? `${c.discountValue}%` : `GHS ${c.discountValue.toFixed(2)}`;

export function formatPreview(form: CreateCouponPayload): string {
  if (form.discountType === 'percentage') {
    return `${form.discountValue}% off`;
  }
  return `GHS ${form.discountValue.toFixed(2)} off`;
}
