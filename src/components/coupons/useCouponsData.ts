import { useEffect, useState } from 'react';
import couponService from '../../services/couponService';
import type { Coupon } from '../../services/couponService';

// Fetches coupons, plus toggle/delete actions. Split out of the former
// monolithic CouponsPage.
export function useCouponsData() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const data = await couponService.getAll(true);
      setCoupons(data);
    } catch {
      // silently fail — table stays empty
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleToggle = async (coupon: Coupon) => {
    try {
      const updated = await couponService.toggleStatus(coupon.id, !coupon.active);
      setCoupons(prev => prev.map(c => (c.id === updated.id ? updated : c)));
    } catch {
      alert('Failed to update coupon status.');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await couponService.delete(id);
      setCoupons(prev => prev.filter(c => c.id !== id));
    } catch {
      alert('Failed to delete coupon.');
    }
  };

  return { coupons, setCoupons, loading, handleToggle, handleDelete };
}
