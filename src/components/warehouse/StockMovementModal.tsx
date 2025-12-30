import React, { useState } from 'react';
import inventoryService from '../../services/inventoryService';

interface StockMovementModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  productId: number | null;
  productName?: string;
  currentStock?: number;
}

const StockMovementModal: React.FC<StockMovementModalProps> = ({
  open,
  onClose,
  onSuccess,
  productId,
  productName,
  currentStock,
}) => {
  const [type, setType] = useState<'IN' | 'OUT' | 'ADJUSTMENT'>('OUT');
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

    if (!reason.trim()) {
      setError('Please enter a reason');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log(`📦 [StockMovementModal] Recording ${type} movement for product ${productId}`);
      await inventoryService.recordMovement(productId!, {
        type,
        quantity: parseInt(quantity),
        reason: reason.trim(),
        reference: reference.trim() || undefined,
      });

      console.log('✅ [StockMovementModal] Movement recorded');
      alert('Stock movement recorded successfully!');
      setQuantity('');
      setReason('');
      setReference('');
      setType('OUT');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('❌ [StockMovementModal] Failed to record movement:', err);
      setError(err.message || 'Failed to record movement');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const reasonOptions = {
    OUT: [
      { value: 'customer_order', label: 'Customer Order' },
      { value: 'warehouse_to_rider', label: 'To Rider' },
      { value: 'damage', label: 'Damaged Item' },
      { value: 'expiry', label: 'Expired' },
      { value: 'other', label: 'Other' },
    ],
    IN: [
      { value: 'supplier_delivery', label: 'Supplier Delivery' },
      { value: 'return', label: 'Customer Return' },
      { value: 'stock_correction', label: 'Stock Correction' },
      { value: 'other', label: 'Other' },
    ],
    ADJUSTMENT: [
      { value: 'inventory_count', label: 'Inventory Count' },
      { value: 'correction', label: 'Manual Correction' },
      { value: 'system_error', label: 'System Error' },
      { value: 'other', label: 'Other' },
    ],
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold">Record Stock Movement</h2>
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
              Movement Type *
            </label>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value as 'IN' | 'OUT' | 'ADJUSTMENT');
                setReason('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="IN">Stock In (Addition)</option>
              <option value="OUT">Stock Out (Removal)</option>
              <option value="ADJUSTMENT">Adjustment</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity *
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 10"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="">Select reason</option>
              {reasonOptions[type].map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
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
              placeholder="e.g., ORD-12345"
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
              className="px-4 py-2 rounded bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Recording...' : 'Record Movement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockMovementModal;
