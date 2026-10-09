interface DeleteCouponModalProps {
  onCancel: () => void;
  onConfirm: () => void;
}

export default function DeleteCouponModal({ onCancel, onConfirm }: DeleteCouponModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Coupon?</h3>
        <p className="text-sm text-gray-600 mb-6">
          This coupon will be permanently deleted and can no longer be used at checkout.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
