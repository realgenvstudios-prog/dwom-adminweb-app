import type { Coupon } from '../../services/couponService';
import { isExpired, formatDiscount } from './couponFormat';

interface CouponsTableProps {
  loading: boolean;
  filtered: Coupon[];
  search: string;
  filterStatus: 'all' | 'active' | 'inactive';
  onToggle: (coupon: Coupon) => void;
  onEdit: (coupon: Coupon) => void;
  onRequestDelete: (id: number) => void;
}

const COLUMNS = ['Code', 'Description', 'Discount', 'Min Order', 'Uses', 'Per User', 'Expires', 'Status', 'Actions'];

// The coupons table. Split out of the former monolithic CouponsPage.
export default function CouponsTable({ loading, filtered, search, filterStatus, onToggle, onEdit, onRequestDelete }: CouponsTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin h-8 w-8 border-4 border-red-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <div className="text-5xl mb-4">🏷️</div>
        <div className="text-lg font-medium">No coupons found</div>
        <div className="text-sm mt-1">
          {search || filterStatus !== 'all' ? 'Try adjusting filters' : 'Create your first discount code'}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            {COLUMNS.map(h => (
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
                    onClick={() => onToggle(coupon)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${coupon.active ? 'bg-green-500' : 'bg-gray-300'}`}
                    title={coupon.active ? 'Click to deactivate' : 'Click to activate'}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${coupon.active ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEdit(coupon)}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onRequestDelete(coupon.id)}
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
  );
}
