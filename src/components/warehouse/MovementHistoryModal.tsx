import React, { useState, useEffect } from 'react';
import inventoryService from '../../services/inventoryService';
import type { MovementRecord } from '../../services/inventoryService';

interface MovementHistoryModalProps {
  open: boolean;
  onClose: () => void;
  productId: number | null;
  productName?: string;
}

const MovementHistoryModal: React.FC<MovementHistoryModalProps> = ({
  open,
  onClose,
  productId,
  productName,
}) => {
  const [movements, setMovements] = useState<MovementRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && productId) {
      fetchMovementHistory();
    }
  }, [open, productId]);

  const fetchMovementHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`📦 [MovementHistoryModal] Fetching history for product ${productId}`);

      const data = await inventoryService.getMovementHistory(productId!, 50);
      console.log('✅ [MovementHistoryModal] History loaded:', data.length);
      setMovements(data);
    } catch (err: any) {
      console.error('❌ [MovementHistoryModal] Failed to fetch history:', err);
      setError(err.message || 'Failed to load movement history');
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'IN':
        return 'bg-green-100 text-green-700';
      case 'OUT':
        return 'bg-red-100 text-red-700';
      case 'ADJUSTMENT':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'IN':
        return '📥';
      case 'OUT':
        return '📤';
      case 'ADJUSTMENT':
        return '🔧';
      default:
        return '📋';
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 my-8 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="sticky top-0 px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white z-10">
          <div>
            <h2 className="text-2xl font-bold">Stock Movement History</h2>
            <p className="text-sm text-gray-600 mt-1">{productName || 'Unknown Product'}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none flex-shrink-0"
          >
            ×
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12 bg-white flex-1">
            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="ml-3 text-gray-600">Loading movement history...</p>
          </div>
        )}

        {error && (
          <div className="p-6 bg-red-50 text-red-700 flex-1">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="px-6 py-4 overflow-y-auto flex-1 bg-white">
            {movements.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No movement history available</p>
            ) : (
              <div className="space-y-3">
                {movements.map((movement) => (
                  <div key={movement.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <span className="text-2xl">{getTypeIcon(movement.type)}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${getTypeColor(movement.type)}`}>
                              {movement.type}
                            </span>
                            <span className="font-semibold text-gray-900">
                              {movement.quantity} units
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{movement.reason}</p>
                          {movement.reference && (
                            <p className="text-xs text-gray-500">
                              Ref: <span className="font-mono">{movement.reference}</span>
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-gray-500">
                          {new Date(movement.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(movement.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="sticky bottom-0 px-6 py-4 border-t border-gray-200 bg-white z-10">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 rounded bg-gray-100 text-gray-700 font-medium hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default MovementHistoryModal;
