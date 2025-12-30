import React, { useState } from 'react';
import inventoryService from '../../services/inventoryService';

interface UpdateStockModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  productId: number | null;
  productName?: string;
  currentStock?: number;
}

const UpdateStockModal: React.FC<UpdateStockModalProps> = ({
  open,
  onClose,
  onSuccess,
  productId,
  productName,
  currentStock,
}) => {
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!quantity || parseInt(quantity) <= 0) {
      setError('Please enter a valid quantity');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log(`📦 [UpdateStockModal] Restocking product ${productId}`);
      await inventoryService.restock(productId!, {
        quantity: parseInt(quantity),
        reason: reason.trim() || undefined,
        reference: reference.trim() || undefined,
      });

      console.log('✅ [UpdateStockModal] Stock updated');
      alert('Stock updated successfully!');
      setQuantity('');
      setReason('');
      setReference('');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('❌ [UpdateStockModal] Failed to update stock:', err);
      setError(err.message || 'Failed to update stock');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold">Update Stock</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {error && (
            <div className="p-3 rounded bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product
            </label>
            <p className="px-3 py-2 rounded bg-gray-50 text-gray-700 font-medium">
              {productName || 'Unknown Product'}
            </p>
          </div>

          {currentStock !== undefined && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Stock
              </label>
              <p className="px-3 py-2 rounded bg-gray-50 text-gray-700 font-medium">
                {currentStock} units
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Add Quantity *
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 50"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="">Select reason</option>
              <option value="supplier_delivery">Supplier Delivery</option>
              <option value="return">Product Return</option>
              <option value="stock_correction">Stock Correction</option>
              <option value="warehouse_transfer">Warehouse Transfer</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reference Number
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., PO-12345, DR-67890"
              disabled={loading}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateStockModal;
