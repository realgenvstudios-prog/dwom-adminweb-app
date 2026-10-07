import React, { useState, useEffect } from 'react';
import bundlesService from '../../services/bundlesService';
import productsService from '../../services/productsService';
import type { Bundle } from '../../services/bundlesService';
import type { Product } from './BundleTypes';
import type { Category } from '../../services/productsService';
import ImageUpload from '../common/ImageUpload';
import VariationGroupsEditor from '../products/VariationGroupsEditor';
import type { VariationGroup } from '../products/VariationGroupsEditor';

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
  const [discount, setDiscount] = useState('0');
  const [imageUrl, setImageUrl] = useState('');
  const [bundleItems, setBundleItems] = useState<Array<{ productId: number; quantity: number }>>([]);
  const [variationGroups, setVariationGroups] = useState<VariationGroup[]>([]);
  const [showPreparationOptions, setShowPreparationOptions] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate original total from selected products
  const calculateOriginalTotal = (): number => {
    return bundleItems.reduce((total, item) => {
      const product = availableProducts.find(p => p.id === item.productId);
      if (product) {
        const price = typeof product.pricePerUnit === 'string' 
          ? parseFloat(product.pricePerUnit) 
          : product.pricePerUnit;
        return total + (price * item.quantity);
      }
      return total;
    }, 0);
  };

  // Calculate final price after discount
  const calculateFinalPrice = (): number => {
    const originalTotal = calculateOriginalTotal();
    const discountPercent = parseFloat(discount) || 0;
    const discountAmount = originalTotal * (discountPercent / 100);
    return originalTotal - discountAmount;
  };

  const originalTotal = calculateOriginalTotal();
  const finalPrice = calculateFinalPrice();
  const savingsAmount = originalTotal - finalPrice;

  // Pre-fetch products on mount so they're ready instantly when modal opens
  useEffect(() => {
    fetchProducts();
  }, []);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      // Re-fetch only if we have no products yet (first load failed etc.)
      if (availableProducts.length === 0) {
        fetchProducts();
      }
      if (editingBundle) {
        setName(editingBundle.name);
        setDescription(editingBundle.description || '');
        setDiscount((editingBundle.discount || 0).toString());
        setImageUrl(editingBundle.imageUrl || '');
        // Use BundleItem if available (from backend), otherwise use items
        const itemsToLoad = editingBundle.BundleItem || editingBundle.items || [];
        setBundleItems(itemsToLoad.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        })));
        setVariationGroups(
          (editingBundle.BundleVariationGroup || []).map(({ id, ...group }) => group)
        );
        setShowPreparationOptions(editingBundle.showPreparationOptions || false);
      } else {
        setName('');
        setDescription('');
        setDiscount('0');
        setImageUrl('');
        setBundleItems([]);
        setVariationGroups([]);
        setShowPreparationOptions(false);
      }
      setError(null);
    }
  }, [open, editingBundle]);

  const fetchProducts = async () => {
    try {
      const products = await productsService.getAll();
      setAvailableProducts(products as any);

      // Extract unique categories from products (since backend includes Category in each product)
      const catMap = new Map<number, Category>();
      (products as any[]).forEach((p: any) => {
        if (p.Category && p.Category.id && !catMap.has(p.Category.id)) {
          catMap.set(p.Category.id, { id: p.Category.id, name: p.Category.name, description: p.Category.description });
        } else if (p.categoryId && p.category && !catMap.has(p.categoryId)) {
          catMap.set(p.categoryId, { id: p.categoryId, name: p.category.name || p.category, description: '' });
        }
      });
      setCategories(Array.from(catMap.values()).sort((a, b) => a.name.localeCompare(b.name)));
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

    if (bundleItems.length === 0) {
      setError('Add at least one product to the bundle');
      return;
    }

    if (finalPrice <= 0) {
      setError('Bundle price must be greater than 0. Add products or reduce discount.');
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
          price: parseFloat(finalPrice.toFixed(2)),
          discount: parseFloat(discount) || undefined,
          imageUrl: imageUrl.trim() || undefined,
          items: bundleItems,
          showPreparationOptions,
          variationGroups,
        });
        console.log('✅ [CreateBundleModal] Bundle updated');
        alert('Bundle updated successfully!');
      } else {
        console.log('📦 [CreateBundleModal] Creating new bundle');
        await bundlesService.create({
          name: name.trim(),
          description: description.trim() || undefined,
          price: parseFloat(finalPrice.toFixed(2)),
          discount: parseFloat(discount) || undefined,
          imageUrl: imageUrl.trim() || undefined,
          items: bundleItems,
          showPreparationOptions,
          variationGroups: variationGroups.length > 0 ? variationGroups : undefined,
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

          {/* Price Calculation Display */}
          {bundleItems.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">💰 Price Calculation</h4>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Original Total:</span>
                <span className="font-medium">GHS {originalTotal.toFixed(2)}</span>
              </div>
              {parseFloat(discount) > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount ({discount}%):</span>
                  <span className="font-medium">- GHS {savingsAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-gray-300 pt-2 mt-2">
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-gray-800">Final Bundle Price:</span>
                  <span className="text-blue-600">GHS {finalPrice.toFixed(2)}</span>
                </div>
              </div>
              {parseFloat(discount) > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  ✨ Customers save GHS {savingsAmount.toFixed(2)} ({discount}% off)
                </p>
              )}
            </div>
          )}

          <ImageUpload label="Bundle Image" value={imageUrl} onChange={setImageUrl} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Products * ({bundleItems.length} selected)
            </label>

            {/* Selected Products Summary */}
            {bundleItems.length > 0 && (
              <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs font-semibold text-blue-700 mb-2">Selected Products:</p>
                <div className="flex flex-wrap gap-2">
                  {bundleItems.map(item => {
                    const product = availableProducts.find(p => p.id === item.productId);
                    return (
                      <span key={item.productId} className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-blue-200 rounded-full text-xs text-blue-800">
                        {product?.nameEnglish || `Product #${item.productId}`} × {item.quantity}
                        <button
                          type="button"
                          onClick={() => toggleProduct(item.productId)}
                          className="ml-1 text-red-400 hover:text-red-600 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Category Tabs + Search */}
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              {/* Search bar */}
              <div className="p-2 border-b border-gray-200 bg-gray-50">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
              </div>

              {/* Category tabs */}
              <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200 bg-gray-50">
                <button
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedCategory === null
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  All ({availableProducts.length})
                </button>
                {categories.map(cat => {
                  const count = availableProducts.filter(p => ((p as any).categoryId === cat.id || (p as any).Category?.id === cat.id)).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        selectedCategory === cat.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {cat.name} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Product list filtered by category and search */}
              <div className="p-2 space-y-2 max-h-64 overflow-y-auto">
                {availableProducts.length === 0 ? (
                  <p className="text-gray-500 text-sm py-4 text-center">No products available</p>
                ) : (() => {
                  const filtered = availableProducts.filter(product => {
                    const matchesCategory = selectedCategory === null || (product as any).categoryId === selectedCategory || (product as any).Category?.id === selectedCategory;
                    const matchesSearch = !productSearch.trim() || 
                      product.nameEnglish?.toLowerCase().includes(productSearch.toLowerCase()) ||
                      product.nameLocal?.toLowerCase().includes(productSearch.toLowerCase());
                    return matchesCategory && matchesSearch;
                  });

                  if (filtered.length === 0) {
                    return (
                      <p className="text-gray-500 text-sm py-4 text-center">
                        No products match your search{selectedCategory ? ' in this category' : ''}
                      </p>
                    );
                  }

                  return filtered.map((product) => {
                    const bundleItem = bundleItems.find(item => item.productId === product.id);
                    const price = typeof product.pricePerUnit === 'string' 
                      ? parseFloat(product.pricePerUnit) 
                      : (product.pricePerUnit as number);
                    return (
                      <div key={product.id as number} className={`border rounded p-3 transition-colors ${bundleItem ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}`}>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!bundleItem}
                            onChange={() => toggleProduct(product.id as any)}
                            disabled={loading}
                            className="w-4 h-4 accent-blue-600"
                          />
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">{product.nameEnglish}</span>
                              <span className="text-xs text-gray-500">
                                GHS {price.toFixed(2)}
                              </span>
                            </div>
                            {product.nameLocal && product.nameLocal !== product.nameEnglish && (
                              <p className="text-xs text-gray-400">{product.nameLocal}</p>
                            )}
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
                              className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              disabled={loading}
                            />
                            <span className="text-xs text-gray-500">
                              = GHS {(price * bundleItem.quantity).toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>

          {/* Variation Groups */}
          <div className="border-t pt-6">
            <VariationGroupsEditor
              groups={variationGroups}
              onChange={setVariationGroups}
              showPreparationOptions={showPreparationOptions}
              onShowPrepChange={setShowPreparationOptions}
              basePrice={finalPrice}
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
              {loading ? 'Saving...' : editingBundle ? 'Update Bundle' : 'Create Bundle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBundleModal;
