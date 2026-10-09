import type { Coupon, CreateCouponPayload } from '../../services/couponService';
import { formatPreview } from './couponFormat';

interface CouponFormModalProps {
  editingCoupon: Coupon | null;
  form: CreateCouponPayload;
  setForm: React.Dispatch<React.SetStateAction<CreateCouponPayload>>;
  formError: string;
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
}

// The create/edit coupon modal. Split out of the former monolithic
// CouponsPage.
export default function CouponFormModal({ editingCoupon, form, setForm, formError, saving, onClose, onSave }: CouponFormModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            {editingCoupon ? 'Edit Coupon' : 'Create Discount Code'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
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
              min={new Date().toISOString().split('T')[0]}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              value={form.expiresAt ?? ''}
              onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value || null }))}
            />
            <p className="text-xs text-gray-400 mt-1">
              Valid through the end of this day. Leave blank for no expiry.
            </p>
            {form.expiresAt && form.expiresAt < new Date().toISOString().split('T')[0] && (
              <p className="text-xs text-red-600 mt-1">
                ⚠ This date is in the past — the coupon will be expired immediately.
              </p>
            )}
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
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
          >
            {saving ? 'Saving…' : editingCoupon ? 'Save Changes' : 'Create Coupon'}
          </button>
        </div>
      </div>
    </div>
  );
}
