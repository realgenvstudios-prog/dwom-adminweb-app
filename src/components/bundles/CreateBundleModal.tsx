import React, { useState } from 'react';
import type { Bundle } from '../../services/bundlesService';
import ImageUpload from '../common/ImageUpload';
import { useAvailableProducts } from './createBundle/useAvailableProducts';
import { useBundleForm } from './createBundle/useBundleForm';
import PriceCalculationCard from './createBundle/PriceCalculationCard';
import SelectedProductsSummary from './createBundle/SelectedProductsSummary';
import ProductPicker from './createBundle/ProductPicker';

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
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [productSearch, setProductSearch] = useState('');

  const { availableProducts, categories } = useAvailableProducts(open);
  const {
    name, setName,
    description, setDescription,
    discount, setDiscount,
    imageUrl, setImageUrl,
    bundleItems,
    loading,
    error,
    originalTotal,
    finalPrice,
    savingsAmount,
    handleSubmit,
    toggleProduct,
    updateProductQuantity,
    toggleVisibleOption,
  } = useBundleForm(open, editingBundle, availableProducts, onBundleCreated, onClose);

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
            <PriceCalculationCard
              originalTotal={originalTotal}
              finalPrice={finalPrice}
              savingsAmount={savingsAmount}
              discount={discount}
            />
          )}

          <ImageUpload label="Bundle Image" value={imageUrl} onChange={setImageUrl} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Products * ({bundleItems.length} selected)
            </label>

            {/* Selected Products Summary */}
            {bundleItems.length > 0 && (
              <SelectedProductsSummary
                bundleItems={bundleItems}
                availableProducts={availableProducts}
                onRemove={toggleProduct}
              />
            )}

            {/* Category Tabs + Search */}
            <ProductPicker
              availableProducts={availableProducts}
              categories={categories}
              bundleItems={bundleItems}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              productSearch={productSearch}
              setProductSearch={setProductSearch}
              loading={loading}
              onToggleProduct={toggleProduct}
              onUpdateQuantity={updateProductQuantity}
              onToggleVisibleOption={toggleVisibleOption}
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
