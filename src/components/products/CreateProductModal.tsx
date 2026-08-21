import React, { useRef, useState } from 'react';
import productsService from '../../services/productsService';
import VariationGroupsEditor from './VariationGroupsEditor';
import type { VariationGroup } from './VariationGroupsEditor';
import ImageUpload from '../common/ImageUpload';

interface Props {
  open: boolean;
  onClose: () => void;
  onProductCreated?: () => void;
  categories: any[];
}

const EMPTY_FORM = {
  nameEnglish: '',
  nameFrench: '',
  nameLocal: '',
  categoryId: '',
  pricePerUnit: '',
  unitType: 'Kg',
  description: '',
  imageUrl: '',
  inventoryQuantity: '',
};

const CreateProductModal: React.FC<Props> = ({ open, onClose, onProductCreated, categories }) => {
  const [loading, setLoading] = useState(false);
  const [savingMode, setSavingMode] = useState<'create' | 'again' | null>(null);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [variationGroups, setVariationGroups] = useState<VariationGroup[]>([]);
  const [showPreparationOptions, setShowPreparationOptions] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  const isDirty = () =>
    Object.entries(formData).some(([key, value]) => value !== (EMPTY_FORM as any)[key]) ||
    variationGroups.length > 0;

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!formData.nameEnglish.trim()) errs.nameEnglish = 'English name is required';
    if (!formData.nameLocal.trim()) errs.nameLocal = 'Local name is required';
    if (!formData.categoryId) errs.categoryId = 'Please select a category';
    if (!formData.pricePerUnit || parseFloat(formData.pricePerUnit) <= 0) errs.pricePerUnit = 'Enter a valid price';
    return errs;
  };

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submitProduct = async (keepOpen: boolean) => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      scrollToTop();
      return;
    }
    setErrors({});

    try {
      setLoading(true);
      setSavingMode(keepOpen ? 'again' : 'create');
      console.log('📦 [CreateProductModal] Creating product:', formData);

      const payload = {
        nameEnglish: formData.nameEnglish,
        nameFrench: formData.nameFrench || undefined,
        nameLocal: formData.nameLocal,
        categoryId: parseInt(formData.categoryId),
        pricePerUnit: parseFloat(formData.pricePerUnit),
        unitType: formData.unitType,
        description: formData.description || undefined,
        imageUrl: formData.imageUrl || undefined,
        inventoryQuantity: formData.inventoryQuantity ? parseInt(formData.inventoryQuantity) : 0,
        showPreparationOptions,
        variationGroups: variationGroups.length > 0 ? variationGroups : undefined,
      };

      const response = await productsService.create(payload);
      console.log('✅ [CreateProductModal] Product created:', response);

      // Reset form
      setFormData({ ...EMPTY_FORM });
      setVariationGroups([]);
      setShowPreparationOptions(false);

      onProductCreated?.();

      if (keepOpen) {
        scrollToTop();
      } else {
        onClose();
      }
    } catch (error: any) {
      console.error('❌ [CreateProductModal] Failed to create product:', error);
      alert(`Failed to create product: ${error.message}`);
    } finally {
      setLoading(false);
      setSavingMode(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitProduct(false);
  };

  const handleSaveAndAddAnother = () => {
    submitProduct(true);
  };

  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    // A form with many text inputs submits on Enter by default — that's
    // surprising here since Enter is often pressed while still filling out
    // earlier fields (e.g. a variation group name). Only the Save buttons
    // should submit.
    if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
      e.preventDefault();
    }
  };

  const handleRequestClose = () => {
    if (isDirty() && !window.confirm('Discard this product? Your changes will be lost.')) {
      return;
    }
    onClose();
  };

  if (!open) return null;

  const fieldClass = (field: string) =>
    `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      errors[field] ? 'border-red-400' : 'border-gray-300'
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-40" onClick={handleRequestClose} />

      {/* Modal */}
      <div ref={scrollRef} className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
          <h2 className="text-xl font-bold text-gray-900">Create New Product</h2>
          <button className="text-gray-400 hover:text-gray-700" onClick={handleRequestClose}>
            <span className="text-2xl">×</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className="p-6 space-y-6">
          {Object.keys(errors).length > 0 && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
              <p className="font-medium mb-1">Please fix the following:</p>
              <ul className="list-disc list-inside space-y-0.5">
                {Object.values(errors).map((msg, i) => (
                  <li key={i}>{msg}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Basic Info</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name (English) *</label>
              <input
                type="text"
                value={formData.nameEnglish}
                onChange={(e) => setFormData({ ...formData, nameEnglish: e.target.value })}
                className={fieldClass('nameEnglish')}
                placeholder="e.g., Tomatoes"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name (Local) *</label>
              <input
                type="text"
                value={formData.nameLocal}
                onChange={(e) => setFormData({ ...formData, nameLocal: e.target.value })}
                className={fieldClass('nameLocal')}
                placeholder="e.g., Ntoosi"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name (French)</label>
              <input
                type="text"
                value={formData.nameFrench}
                onChange={(e) => setFormData({ ...formData, nameFrench: e.target.value })}
                className={fieldClass('nameFrench')}
                placeholder="e.g., Tomates"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className={fieldClass('categoryId')}
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pricing & Stock */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Pricing & Stock</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price Per Unit (GHS) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.pricePerUnit}
                onChange={(e) => setFormData({ ...formData, pricePerUnit: e.target.value })}
                className={fieldClass('pricePerUnit')}
                placeholder="e.g., 12.50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit Type *</label>
              <select
                value={formData.unitType}
                onChange={(e) => setFormData({ ...formData, unitType: e.target.value })}
                className={fieldClass('unitType')}
              >
                <option value="Kg">Kilogram (Kg)</option>
                <option value="Gm">Gram (Gm)</option>
                <option value="Piece">Piece</option>
                <option value="Pack">Pack</option>
                <option value="Bunch">Bunch</option>
                <option value="Jar">Jar</option>
                <option value="Bottle">Bottle</option>
                <option value="Litre">Litre</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Initial Inventory Quantity (Optional)</label>
              <input
                type="number"
                step="1"
                min="0"
                value={formData.inventoryQuantity}
                onChange={(e) => setFormData({ ...formData, inventoryQuantity: e.target.value })}
                className={fieldClass('inventoryQuantity')}
                placeholder="e.g., 100"
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty to start with 0 units in stock</p>
            </div>
          </div>

          {/* Description & Image */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Description & Image</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={fieldClass('description')}
                placeholder="Add product description..."
                rows={3}
              />
            </div>

            <ImageUpload
              label="Product Image (Optional)"
              value={formData.imageUrl}
              onChange={(url) => setFormData({ ...formData, imageUrl: url })}
            />
          </div>

          {/* Variation Groups */}
          <div className="border-t pt-6">
            <VariationGroupsEditor
              groups={variationGroups}
              onChange={setVariationGroups}
              showPreparationOptions={showPreparationOptions}
              onShowPrepChange={setShowPreparationOptions}
              basePrice={parseFloat(formData.pricePerUnit) || 0}
            />
          </div>
        </form>

        {/* Buttons */}
        <div className="sticky bottom-0 z-10 bg-white border-t px-6 py-4 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => submitProduct(false)}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {loading && savingMode === 'create' ? 'Creating...' : 'Create Product'}
          </button>
          <button
            type="button"
            onClick={handleSaveAndAddAnother}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50 font-medium"
          >
            {loading && savingMode === 'again' ? 'Saving...' : 'Save & Add Another'}
          </button>
          <button
            type="button"
            onClick={handleRequestClose}
            disabled={loading}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateProductModal;
