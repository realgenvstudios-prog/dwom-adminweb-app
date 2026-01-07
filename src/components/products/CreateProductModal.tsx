import React, { useState } from 'react';
import productsService from '../../services/productsService';

interface Props {
  open: boolean;
  onClose: () => void;
  onProductCreated?: () => void;
  categories: any[];
}

const CreateProductModal: React.FC<Props> = ({ open, onClose, onProductCreated, categories }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nameEnglish: '',
    nameLocal: '',
    categoryId: '',
    pricePerUnit: '',
    unitType: 'Kg',
    description: '',
    imageUrl: '',
    inventoryQuantity: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      console.log('📦 [CreateProductModal] Creating product:', formData);

      // Validate required fields
      if (!formData.nameEnglish || !formData.nameLocal || !formData.categoryId || !formData.pricePerUnit) {
        alert('Please fill in all required fields');
        return;
      }

      const payload = {
        nameEnglish: formData.nameEnglish,
        nameLocal: formData.nameLocal,
        categoryId: parseInt(formData.categoryId),
        pricePerUnit: parseFloat(formData.pricePerUnit),
        unitType: formData.unitType,
        description: formData.description || undefined,
        imageUrl: formData.imageUrl || undefined,
        inventoryQuantity: formData.inventoryQuantity ? parseInt(formData.inventoryQuantity) : 0,
      };

      const response = await productsService.create(payload);
      console.log('✅ [CreateProductModal] Product created:', response);
      alert(`Product "${response.nameEnglish}" created successfully!`);
      
      // Reset form
      setFormData({
        nameEnglish: '',
        nameLocal: '',
        categoryId: '',
        pricePerUnit: '',
        unitType: 'Kg',
        description: '',
        imageUrl: '',
        inventoryQuantity: '',
      });
      
      onProductCreated?.();
      onClose();
    } catch (error: any) {
      console.error('❌ [CreateProductModal] Failed to create product:', error);
      alert(`Failed to create product: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-40" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
          <h2 className="text-xl font-bold text-gray-900">Create New Product</h2>
          <button className="text-gray-400 hover:text-gray-700" onClick={onClose}>
            <span className="text-2xl">×</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* English Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name (English) *</label>
            <input
              type="text"
              required
              value={formData.nameEnglish}
              onChange={(e) => setFormData({ ...formData, nameEnglish: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Tomatoes"
            />
          </div>

          {/* Local Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name (Local) *</label>
            <input
              type="text"
              required
              value={formData.nameLocal}
              onChange={(e) => setFormData({ ...formData, nameLocal: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Ntoosi"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select
              required
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price Per Unit (GHS) *</label>
            <input
              type="number"
              required
              step="0.01"
              min="0"
              value={formData.pricePerUnit}
              onChange={(e) => setFormData({ ...formData, pricePerUnit: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 12.50"
            />
          </div>

          {/* Unit Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit Type *</label>
            <select
              value={formData.unitType}
              onChange={(e) => setFormData({ ...formData, unitType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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

          {/* Initial Inventory Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Initial Inventory Quantity (Optional)</label>
            <input
              type="number"
              step="1"
              min="0"
              value={formData.inventoryQuantity}
              onChange={(e) => setFormData({ ...formData, inventoryQuantity: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 100"
            />
            <p className="text-xs text-gray-500 mt-1">Leave empty to start with 0 units in stock</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add product description..."
              rows={3}
            />
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (Optional)</label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/image.jpg"
            />
            {formData.imageUrl && (
              <div className="mt-2 flex items-center gap-2">
                <img
                  src={formData.imageUrl}
                  alt="Preview"
                  className="w-16 h-16 rounded object-cover border border-gray-300"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <span className="text-xs text-gray-500">Preview</span>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {loading ? 'Creating...' : 'Create Product'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProductModal;
