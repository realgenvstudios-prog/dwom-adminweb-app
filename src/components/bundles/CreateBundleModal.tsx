import React, { useState, useEffect } from 'react';
import bundlesService from '../../services/bundlesService';
import productsService from '../../services/productsService';
import type { Bundle } from '../../services/bundlesService';
import type { Product } from './BundleTypes';

interface CreateBundleModalProps {
  open: boolean;
  onClose: () => void;
  onBundleCreated: () => void;
  editingBundle?: Bundle | null;
}

const CreateBundleModal: React.FC<CreateBundleModalProps> = ({ 
  open, 
  onClose, 
  onBundleCreated,
  editingBundle 
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('0');
  const [discount, setDiscount] = useState('0');
  const [imageUrl, setImageUrl] = useState('');
  const [bundleItems, setBundleItems] = useState<Array<{ productId: number; quantity: number }>>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available products
  useEffect(() => {
    if (open) {
      fetchProducts();
      if (editingBundle) {
        setName(editingBundle.name);
        setDescription(editingBundle.description || '');
        setPrice(editingBundle.price.toString());
        setDiscount((editingBundle.discount || 0).toString());
        setImageUrl(editingBundle.imageUrl || '');
        // Use BundleItem if available (from backend), otherwise use items
        const itemsToLoad = editingBundle.BundleItem || editingBundle.items || [];
        setBundleItems(itemsToLoad.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        })));
      } else {
        setName('');
        setDescription('');
        setPrice('0');
        setDiscount('0');
        setImageUrl('');
        setBundleItems([]);
      }
      setError(null);
    }
  }, [open, editingBundle]);

  const fetchProducts = async () => {
    try {
      const products = await productsService.getAll();
      setAvailableProducts(products as any);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Bundle name is required');
      return;
    }

    if (!price || parseFloat(price) <= 0) {
      setError('Bundle price must be greater than 0');
      return;
    }

    if (bundleItems.length === 0) {
      setError('Add at least one product to the bundle');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (editingBundle) {
        console.log(`✏️ [CreateBundleModal] Updating bundle ${editingBundle.id}`);
        await bundlesService.update(editingBundle.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          price: parseFloat(price),
          discount: parseFloat(discount) || undefined,
          imageUrl: imageUrl.trim() || undefined,
        });
        console.log('✅ [CreateBundleModal] Bundle updated');
        alert('Bundle updated successfully!');
      } else {
        console.log('📦 [CreateBundleModal] Creating new bundle');
        await bundlesService.create({
          name: name.trim(),
          description: description.trim() || undefined,
          price: parseFloat(price),
          discount: parseFloat(discount) || undefined,
          imageUrl: imageUrl.trim() || undefined,
          items: bundleItems,
        });
        console.log('✅ [CreateBundleModal] Bundle created');
        alert('Bundle created successfully!');
      }

      onBundleCreated();
      onClose();
    } catch (err: any) {
      console.error('❌ [CreateBundleModal] Failed to save bundle:', err);
      setError(err.message || 'Failed to save bundle');
    } finally {
      setLoading(false);
    }
  };

  const toggleProduct = (productId: number) => {
    setBundleItems(prev =>
      prev.find(item => item.productId === productId)
        ? prev.filter(item => item.productId !== productId)
        : [...prev, { productId, quantity: 1 }]
    );
  };

  const updateProductQuantity = (productId: number, quantity: number) => {
    setBundleItems(prev =>
      prev.map(item =>
        item.productId === productId ? { ...item, quantity: Math.max(1, quantity) } : item
      )
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 my-8">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold">
            {editingBundle ? 'Edit Bundle' : 'Create New Bundle'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bundle Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Breakfast Bundle, Family Pack"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional description..."
              rows={2}
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bundle Price (GHS) *
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 25.50"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Discount (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 10"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image URL
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/bundle-image.jpg"
              disabled={loading}
            />
            {imageUrl && (
              <div className="mt-2 rounded-lg overflow-hidden border border-gray-300">
                <img
                  src={imageUrl}
                  alt="Bundle preview"
                  className="h-32 w-full object-cover"
                  onError={() => {
                    console.log('Image failed to load');
                  }}
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Products * ({bundleItems.length} selected)
            </label>
            <div className="border border-gray-300 rounded-lg p-3 space-y-3 max-h-64 overflow-y-auto">
              {availableProducts.length === 0 ? (
                <p className="text-gray-500 text-sm">No products available</p>
              ) : (
                availableProducts.map((product) => {
                  const bundleItem = bundleItems.find(item => item.productId === product.id);
                  return (
                    <div key={product.id} className="border border-gray-200 rounded p-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!bundleItem}
                          onChange={() => toggleProduct(product.id as any)}
                          disabled={loading}
                          className="w-4 h-4"
                        />
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">{product.nameEnglish}</span>
                            <span className="text-xs text-gray-500">
                              GHS {typeof product.pricePerUnit === 'string' ? parseFloat(product.pricePerUnit).toFixed(2) : (product.pricePerUnit as number).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </label>
                      {bundleItem && (
                        <div className="mt-2 ml-6 flex items-center gap-2">
                          <label className="text-xs text-gray-600">Qty:</label>
                          <input
                            type="number"
                            min="1"
                            value={bundleItem.quantity}
                            onChange={(e) => updateProductQuantity(product.id as any, parseInt(e.target.value))}
                            className="w-12 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={loading}
                          />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
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
              {loading ? 'Saving...' : editingBundle ? 'Update Bundle' : 'Create Bundle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBundleModal;
