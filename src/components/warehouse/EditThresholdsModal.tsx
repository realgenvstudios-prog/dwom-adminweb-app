import React, { useState, useEffect } from "react";
import inventoryService from "../../services/inventoryService";
import type { InventoryItem } from "../../services/inventoryService";

interface EditThresholdsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: InventoryItem | null;
  onSuccess: () => void;
}

const EditThresholdsModal: React.FC<EditThresholdsModalProps> = ({
  isOpen,
  onClose,
  product,
  onSuccess,
}) => {
  const [reorderLevel, setReorderLevel] = useState<number>(0);
  const [reorderQuantity, setReorderQuantity] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setReorderLevel(product.minThreshold || product.maxThreshold || 0);
      setReorderQuantity(product.maxThreshold || 0);
      setError(null);
    }
  }, [product, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product?.productId) return;

    try {
      setLoading(true);
      setError(null);

      await inventoryService.updateThresholds(
        product.productId,
        reorderLevel,
        reorderQuantity
      );

      console.log("✅ Thresholds updated successfully");
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("❌ Failed to update thresholds:", err);
      setError(err.message || "Failed to update thresholds");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">Edit Thresholds</h2>
        <p className="text-gray-600 mb-6">
          Update minimum and reorder quantities for{" "}
          <span className="font-semibold">{product.productName}</span>
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Threshold (Low Stock Alert)
            </label>
            <input
              type="number"
              min="0"
              value={reorderLevel}
              onChange={(e) => setReorderLevel(parseInt(e.target.value) || 0)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 10"
            />
            <p className="text-xs text-gray-500 mt-1">
              Alert when stock drops below this level
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reorder Quantity (Order Amount)
            </label>
            <input
              type="number"
              min="0"
              value={reorderQuantity}
              onChange={(e) => setReorderQuantity(parseInt(e.target.value) || 0)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 50"
            />
            <p className="text-xs text-gray-500 mt-1">
              Quantity to order when restocking
            </p>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-900">
              <span className="font-semibold">Current:</span> Min {product.minThreshold} /
              Reorder {product.maxThreshold}
            </p>
            <p className="text-sm text-blue-900">
              <span className="font-semibold">New:</span> Min {reorderLevel} /
              Reorder {reorderQuantity}
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Updating...
                </>
              ) : (
                "Update Thresholds"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditThresholdsModal;
