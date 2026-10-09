import { useState } from 'react';
import couponService from '../../services/couponService';
import type { Coupon, CreateCouponPayload } from '../../services/couponService';

export const EMPTY_FORM: CreateCouponPayload = {
  code: '',
  description: '',
  discountType: 'percentage',
  discountValue: 0,
  minOrderAmount: 0,
  maxUses: null,
  usagePerUser: 1,
  expiresAt: null,
};

// The create/edit coupon form. Split out of the former monolithic
// CouponsPage. Takes setCoupons from useCouponsData for the optimistic
// create/update on save.
export function useCouponForm(setCoupons: React.Dispatch<React.SetStateAction<Coupon[]>>) {
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [form, setForm] = useState<CreateCouponPayload>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const openCreate = () => {
    setEditingCoupon(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount,
      maxUses: coupon.maxUses,
      usagePerUser: coupon.usagePerUser,
      expiresAt: coupon.expiresAt ? coupon.expiresAt.split('T')[0] : null,
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    setFormError('');
    if (!form.code.trim()) { setFormError('Coupon code is required.'); return; }
    if (!form.description.trim()) { setFormError('Description is required.'); return; }
    if (!form.discountValue || form.discountValue <= 0) { setFormError('Discount value must be greater than 0.'); return; }
    if (form.discountType === 'percentage' && form.discountValue > 100) { setFormError('Percentage discount cannot exceed 100%.'); return; }

    setSaving(true);
    try {
      const payload: CreateCouponPayload = {
        ...form,
        code: form.code.toUpperCase().trim(),
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
        maxUses: form.maxUses || null,
      };

      if (editingCoupon) {
        const updated = await couponService.update(editingCoupon.id, payload);
        setCoupons(prev => prev.map(c => (c.id === updated.id ? updated : c)));
      } else {
        const created = await couponService.create(payload);
        setCoupons(prev => [created, ...prev]);
      }
      setShowModal(false);
    } catch (error: any) {
      const msg = error?.message || 'Failed to save coupon.';
      setFormError(msg.includes('already exists') ? 'That coupon code already exists.' : msg);
    } finally {
      setSaving(false);
    }
  };

  return {
    showModal,
    setShowModal,
    editingCoupon,
    form,
    setForm,
    saving,
    formError,
    openCreate,
    openEdit,
    handleSave,
  };
}
