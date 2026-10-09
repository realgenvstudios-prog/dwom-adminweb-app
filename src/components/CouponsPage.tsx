import React, { useState } from 'react';
import { useCouponsData } from './coupons/useCouponsData';
import { useCouponForm } from './coupons/useCouponForm';
import CouponsStatsCards from './coupons/CouponsStatsCards';
import CouponsFilterBar from './coupons/CouponsFilterBar';
import CouponsTable from './coupons/CouponsTable';
import CouponFormModal from './coupons/CouponFormModal';
import DeleteCouponModal from './coupons/DeleteCouponModal';

const CouponsPage: React.FC = () => {
  const { coupons, setCoupons, loading, handleToggle, handleDelete } = useCouponsData();
  const {
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
  } = useCouponForm(setCoupons);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Delete confirm
  const [deletingId, setDeletingId] = useState<number | null>(null);

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

        <CouponsStatsCards totalCoupons={coupons.length} activeCoupons={activeCoupons} totalUses={totalUses} />

        <CouponsFilterBar search={search} setSearch={setSearch} filterStatus={filterStatus} setFilterStatus={setFilterStatus} />

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <CouponsTable
            loading={loading}
            filtered={filtered}
            search={search}
            filterStatus={filterStatus}
            onToggle={handleToggle}
            onEdit={openEdit}
            onRequestDelete={setDeletingId}
          />
        </div>
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <CouponFormModal
          editingCoupon={editingCoupon}
          form={form}
          setForm={setForm}
          formError={formError}
          saving={saving}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}

      {/* Delete Confirm Modal */}
      {deletingId !== null && (
        <DeleteCouponModal
          onCancel={() => setDeletingId(null)}
          onConfirm={async () => {
            await handleDelete(deletingId);
            setDeletingId(null);
          }}
        />
      )}
    </div>
  );
};

export default CouponsPage;
