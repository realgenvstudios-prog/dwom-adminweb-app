import React, { useState, useEffect } from 'react';
import bundlesService from '../../services/bundlesService';
import type { Bundle } from '../../services/bundlesService';

interface BundleDetailsModalProps {
  open: boolean;
  onClose: () => void;
  bundleId: number | null;
}

const BundleDetailsModal: React.FC<BundleDetailsModalProps> = ({ 
  open, 
  onClose, 
  bundleId 
}) => {
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && bundleId) {
      fetchBundleDetails();
    }
  }, [open, bundleId]);

  const fetchBundleDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`📦 [BundleDetailsModal] Fetching bundle ${bundleId}`);
      
      const data = await bundlesService.getById(bundleId!);
      console.log('✅ [BundleDetailsModal] Bundle details loaded');
      setBundle(data);
    } catch (err: any) {
      console.error('❌ [BundleDetailsModal] Failed to fetch bundle:', err);
      setError(err.message || 'Failed to load bundle details');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white">
          <h2 className="text-2xl font-bold">Bundle Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="ml-3 text-gray-600">Loading bundle details...</p>
          </div>
        )}

        {error && (
          <div className="p-6 bg-red-50 text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && bundle && (
          <div className="px-6 py-4 space-y-6">
            {/* Image */}
            {bundle.imageUrl && (
              <div className="rounded-lg overflow-hidden">
                <img
                  src={bundle.imageUrl}
                  alt={bundle.name}
                  className="h-64 w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Bundle Info */}
            <div>
              <h3 className="text-3xl font-bold text-gray-900">{bundle.name}</h3>
              {bundle.description && (
                <p className="text-gray-600 mt-2">{bundle.description}</p>
              )}
            </div>

            {/* Price and Discount */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Bundle Price</p>
                <p className="text-3xl font-bold text-blue-700">GHS {bundle.price?.toFixed(2)}</p>
              </div>
              {bundle.discount > 0 && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Discount</p>
                  <p className="text-3xl font-bold text-green-700">{bundle.discount}%</p>
                </div>
              )}
            </div>

            {/* Bundle Items */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Items in Bundle ({bundle.BundleItem?.length || 0})
              </h4>
              {bundle.BundleItem && bundle.BundleItem.length > 0 ? (
                <div className="space-y-3">
                  {bundle.BundleItem.map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start gap-4">
                        {/* Product Image */}
                        {item.productImage && (
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            className="h-20 w-20 object-cover rounded"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                        
                        {/* Item Details */}
                        <div className="flex-1">
                          <h5 className="text-lg font-semibold text-gray-900">{item.productName}</h5>
                          <div className="flex justify-between items-center mt-2">
                            <div className="text-sm text-gray-600">
                              <p>Unit Price: <span className="font-medium">GHS {item.unitPrice?.toFixed(2)}</span></p>
                              <p>Quantity: <span className="font-medium">{item.quantity}</span></p>
                            </div>
                            <div className="text-right">
                              <p className="text-gray-600 text-sm">Subtotal</p>
                              <p className="text-2xl font-bold text-gray-900">GHS {item.totalItemPrice?.toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No items in this bundle</p>
              )}
            </div>

            {/* Metadata */}
            {bundle.createdAt && (
              <div className="pt-4 border-t border-gray-200 text-sm text-gray-600">
                <p>Created: {new Date(bundle.createdAt).toLocaleString()}</p>
                {bundle.updatedAt && (
                  <p>Updated: {new Date(bundle.updatedAt).toLocaleString()}</p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="sticky bottom-0 px-6 py-4 border-t border-gray-200 bg-white">
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

export default BundleDetailsModal;
