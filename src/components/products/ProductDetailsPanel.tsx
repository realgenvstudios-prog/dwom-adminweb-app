import React, { useState } from "react";
import productsService from "../../services/productsService";
import type { Product, ProductCategory } from "./ProductTypes";

interface ProductDetailsPanelProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  onProductDeleted?: () => void;
  onProductUpdated?: () => void;
  categories?: ProductCategory[];
}

const ProductDetailsPanel: React.FC<ProductDetailsPanelProps> = ({ 
  product, 
  open, 
  onClose, 
  onProductDeleted,
  onProductUpdated,
  categories = []
}) => {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nameEnglish: product?.nameEnglish || '',
    nameLocal: product?.nameLocal || '',
    pricePerUnit: typeof product?.pricePerUnit === 'string' ? parseFloat(product.pricePerUnit) : (product?.pricePerUnit || 0),
    unitType: product?.unitType || '',
    description: product?.description || '',
    imageUrl: product?.imageUrl || '',
    categoryId: '',
  });

  React.useEffect(() => {
    if (product) {
      setFormData({
        nameEnglish: product.nameEnglish,
        nameLocal: product.nameLocal,
        pricePerUnit: typeof product.pricePerUnit === 'string' ? parseFloat(product.pricePerUnit) : product.pricePerUnit,
        unitType: product.unitType,
        description: product.description || '',
        imageUrl: product.imageUrl || '',
        categoryId: typeof product.category === 'object' ? product.category.id?.toString() : product.category?.toString() || '',
      });
      setEditing(false);
    }
  }, [product]);

  const handleSaveEdit = async () => {
    if (!product) return;
    try {
      setLoading(true);
      const productId = typeof product.id === 'string' ? parseInt(product.id, 10) : product.id;
      console.log(`✏️ [ProductDetailsPanel] Updating product ${productId}`);
      
      await productsService.update(productId, {
        nameEnglish: formData.nameEnglish,
        nameLocal: formData.nameLocal,
        pricePerUnit: formData.pricePerUnit,
        unitType: formData.unitType,
        description: formData.description || undefined,
        imageUrl: formData.imageUrl || undefined,
        categoryId: formData.categoryId ? parseInt(formData.categoryId, 10) : undefined,
      });
      
      console.log('✅ [ProductDetailsPanel] Product updated');
      alert('Product updated successfully!');
      setEditing(false);
      onProductUpdated?.();
    } catch (error: any) {
      console.error('❌ [ProductDetailsPanel] Failed to update product:', error);
      alert(`Failed to update product: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!product) return;
    if (confirm(`Are you sure you want to delete "${product.nameEnglish}"?`)) {
      try {
        setLoading(true);
        const productId = typeof product.id === 'string' ? parseInt(product.id, 10) : product.id;
        console.log(`🗑️ [ProductDetailsPanel] Deleting product ${productId}`);
        
        await productsService.delete(productId);
        
        console.log('✅ [ProductDetailsPanel] Product deleted');
        alert('Product deleted successfully!');
        onProductDeleted?.();
        onClose();
      } catch (error: any) {
        console.error('❌ [ProductDetailsPanel] Failed to delete product:', error);
        alert(`Failed to delete product: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  if (!open || !product) return null;
  return (
    <div className="fixed inset-0 flex justify-end">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-30 pointer-events-auto z-40" onClick={onClose}></div>
      <div className="bg-white w-full max-w-md h-full shadow-xl border-l border-gray-100 pointer-events-auto flex flex-col z-50" style={{ position: 'relative' }}>
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h2 className="text-xl font-bold">Product Details</h2>
          <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>&times;</button>
        </div>
        <div className="p-6 flex-1 overflow-y-auto">
          {!editing ? (
            // View Mode
            <>
              <div className="mb-4">
                <div className="text-lg font-semibold text-gray-900">{product.nameEnglish}</div>
                <div className="text-sm text-gray-500">{product.nameLocal}</div>
              </div>
              <div className="mb-2 text-sm"><span className="font-medium">Category:</span> {typeof product.category === 'object' ? product.category?.name : 'N/A'}</div>
              <div className="mb-2 text-sm"><span className="font-medium">Unit:</span> {product.unitType}</div>
              <div className="mb-2 text-sm"><span className="font-medium">Price:</span> GHS {typeof product.pricePerUnit === 'string' ? parseFloat(product.pricePerUnit).toFixed(2) : (product.pricePerUnit as number).toFixed(2)}</div>
              <div className="mb-4 text-sm"><span className="font-medium">Description:</span> {product.description || 'N/A'}</div>
              <div className="flex gap-2 mt-6">
                <button 
                  onClick={() => setEditing(true)}
                  className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 text-sm"
                >
                  Edit product
                </button>
                <button 
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-4 py-2 rounded bg-red-100 text-red-700 font-semibold hover:bg-red-200 text-sm disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </>
          ) : (
            // Edit Mode
            <>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">English Name</label>
                  <input
                    type="text"
                    value={formData.nameEnglish}
                    onChange={(e) => setFormData({ ...formData, nameEnglish: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Local Name</label>
                  <input
                    type="text"
                    value={formData.nameLocal}
                    onChange={(e) => setFormData({ ...formData, nameLocal: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (GHS)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.pricePerUnit.toString()}
                    onChange={(e) => setFormData({ ...formData, pricePerUnit: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Type</label>
                  <input
                    type="text"
                    value={formData.unitType}
                    onChange={(e) => setFormData({ ...formData, unitType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
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
              </div>
              <div className="flex gap-2 mt-6">
                <button 
                  onClick={handleSaveEdit}
                  disabled={loading}
                  className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700 text-sm disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button 
                  onClick={() => setEditing(false)}
                  disabled={loading}
                  className="px-4 py-2 rounded bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 text-sm disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-30 pointer-events-none" onClick={onClose}></div>
    </div>
  );
};

export default ProductDetailsPanel;
