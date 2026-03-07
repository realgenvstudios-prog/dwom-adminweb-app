import React, { useState, useEffect } from 'react';
import couponService, { type Coupon, type CreateCouponPayload } from '../services/couponService';

const EMPTY_FORM: CreateCouponPayload = {
  code: '',
  description: '',
  discountType: 'percentage',
  discountValue: 0,
  minOrderAmount: 0,
  maxUses: null,
  usagePerUser: 1,
  expiresAt: null,
};

const CouponsPage: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [form, setForm] = useState<CreateCouponPayload>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete confirm
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchCoupons();
  }, []);

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
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = coupons.filter(c => {
    const matchSearch =
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && c.active) ||
      (filterStatus === 'inactive' && !c.active);
    return matchSearch && matchStatus;
  });

  const activeCoupons = coupons.filter(c => c.active).length;
  const totalUses = coupons.reduce((sum, c) => sum + (c.usageCount || 0), 0);

  const isExpired = (coupon: Coupon) =>
    coupon.expiresAt ? new Date(coupon.expiresAt) < new Date() : false;

  const formatDiscount = (c: Coupon) =>
    c.discountType === 'percentage' ? `${c.discountValue}%` : `GHS ${c.discountValue.toFixed(2)}`;

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4">
      <div className="max-w-screen-2xl mx-auto">

        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-5 mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Discount Codes</h1>
            <p className="text-sm text-gray-500 mt-1">Create and manage coupon codes that users apply at checkout</p>
          </div>
          <button
            onClick={openCreate}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
          >
            + New Coupon
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Coupons', value: coupons.length },
            { label: 'Active', value: activeCoupons },
            { label: 'Inactive', value: coupons.length - activeCoupons },
            { label: 'Total Uses', value: totalUses },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-4 mb-6 flex flex-col sm:flex-row gap-3">
          <input
            className="border rounded-lg px-4 py-2 flex-1 text-sm"
            placeholder="Search by code or description…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            className="border rounded-lg px-4 py-2 text-sm min-w-[140px]"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as any)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin h-8 w-8 border-4 border-red-600 border-t-transparent rounded-full" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <div className="text-5xl mb-4">🏷️</div>
              <div className="text-lg font-medium">No coupons found</div>
              <div className="text-sm mt-1">
                {search || filterStatus !== 'all' ? 'Try adjusting filters' : 'Create your first discount code'}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Code', 'Description', 'Discount', 'Min Order', 'Uses', 'Per User', 'Expires', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(coupon => {
                    const expired = isExpired(coupon);
                    return (
                      <tr key={coupon.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-gray-900 whitespace-nowrap">
                          {coupon.code}
                        </td>
                        <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{coupon.description}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${coupon.discountType === 'percentage' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>
                            {formatDiscount(coupon)} off
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                          {coupon.minOrderAmount > 0 ? `GHS ${coupon.minOrderAmount}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                          {coupon.usageCount}
                          {coupon.maxUses ? ` / ${coupon.maxUses}` : ' / ∞'}
                        </td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{coupon.usagePerUser}×</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {coupon.expiresAt ? (
                            <span className={expired ? 'text-red-500 font-medium' : 'text-gray-600'}>
                              {expired ? '⚠ ' : ''}{new Date(coupon.expiresAt).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-gray-400">Never</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button
                            onClick={() => handleToggle(coupon)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${coupon.active ? 'bg-green-500' : 'bg-gray-300'}`}
                            title={coupon.active ? 'Click to deactivate' : 'Click to activate'}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${coupon.active ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEdit(coupon)}
                              className="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setDeletingId(coupon.id)}
                              className="text-red-500 hover:text-red-700 text-xs font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                {editingCoupon ? 'Edit Coupon' : 'Create Discount Code'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                  {formError}
                </div>
              )}

              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code *</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="e.g. SAVE20"
                  value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  disabled={!!editingCoupon}
                />
                {editingCoupon && <p className="text-xs text-gray-400 mt-1">Code cannot be changed after creation.</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="e.g. 20% off your first order"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>

              {/* Discount Type + Value */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type *</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    value={form.discountType}
                    onChange={e => setForm(f => ({ ...f, discountType: e.target.value as 'percentage' | 'fixed' }))}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (GHS)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Value * {form.discountType === 'percentage' ? '(%)' : '(GHS)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={form.discountType === 'percentage' ? 100 : undefined}
                    step="0.01"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder={form.discountType === 'percentage' ? '20' : '10.00'}
                    value={form.discountValue || ''}
                    onChange={e => setForm(f => ({ ...f, discountValue: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              {/* Min Order Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Order Amount (GHS)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="0 = no minimum"
                  value={form.minOrderAmount || ''}
                  onChange={e => setForm(f => ({ ...f, minOrderAmount: parseFloat(e.target.value) || 0 }))}
                />
              </div>

              {/* Max Uses + Per User */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Total Uses</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Leave empty = unlimited"
                    value={form.maxUses ?? ''}
                    onChange={e => setForm(f => ({ ...f, maxUses: e.target.value ? parseInt(e.target.value) : null }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Uses Per User</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="1"
                    value={form.usagePerUser || 1}
                    onChange={e => setForm(f => ({ ...f, usagePerUser: parseInt(e.target.value) || 1 }))}
                  />
                </div>
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={form.expiresAt ?? ''}
                  onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value || null }))}
                />
                <p className="text-xs text-gray-400 mt-1">Leave blank for no expiry.</p>
              </div>

              {/* Preview */}
              {form.code && form.discountValue > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-600">
                  <span className="font-semibold text-gray-800">Preview: </span>
                  Code <span className="font-mono font-bold text-red-600">{form.code}</span> gives{' '}
                  <span className="font-semibold">{formatPreview(form)}</span>
                  {form.minOrderAmount ? ` on orders over GHS ${form.minOrderAmount}` : ''}.
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
              >
                {saving ? 'Saving…' : editingCoupon ? 'Save Changes' : 'Create Coupon'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deletingId !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Coupon?</h3>
            <p className="text-sm text-gray-600 mb-6">
              This coupon will be permanently deleted and can no longer be used at checkout.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function formatPreview(form: CreateCouponPayload): string {
  if (form.discountType === 'percentage') {
    return `${form.discountValue}% off`;
  }
  return `GHS ${form.discountValue.toFixed(2)} off`;
}

export default CouponsPage;
