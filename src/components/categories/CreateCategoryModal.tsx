import React, { useState, useEffect } from 'react';
import categoriesService from '../../services/categoriesService';
import type { Category } from '../../services/categoriesService';

interface CreateCategoryModalProps {
  open: boolean;
  onClose: () => void;
  onCategoryCreated: () => void;
  editingCategory?: Category | null;
}

const CreateCategoryModal: React.FC<CreateCategoryModalProps> = ({ 
  open, 
  onClose, 
  onCategoryCreated,
  editingCategory 
}) => {
  const [name, setName] = useState('');
  const [nameFrench, setNameFrench] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open && editingCategory) {
      setName(editingCategory.name);
      setNameFrench((editingCategory as any).nameFrench || '');
      setDescription(editingCategory.description || '');
      setImageUrl(editingCategory.imageUrl || '');
    } else if (open) {
      setName('');
      setNameFrench('');
      setDescription('');
      setImageUrl('');
    }
    setError(null);
  }, [open, editingCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Category name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (editingCategory) {
        console.log(`✏️ [CreateCategoryModal] Updating category ${editingCategory.id}`);
        await categoriesService.update(editingCategory.id, {
          name: name.trim(),
          nameFrench: nameFrench.trim() || undefined,
          description: description.trim() || undefined,
          imageUrl: imageUrl.trim() || undefined,
        });
        console.log('✅ [CreateCategoryModal] Category updated');
        alert('Category updated successfully!');
      } else {
        console.log('📂 [CreateCategoryModal] Creating new category');
        await categoriesService.create({
          name: name.trim(),
          nameFrench: nameFrench.trim() || undefined,
          description: description.trim() || undefined,
          imageUrl: imageUrl.trim() || undefined,
        });
        console.log('✅ [CreateCategoryModal] Category created');
        alert('Category created successfully!');
      }

      setName('');
      setNameFrench('');
      setDescription('');
      setImageUrl('');
      onCategoryCreated();
      onClose();
    } catch (err: any) {
      console.error('❌ [CreateCategoryModal] Failed to save category:', err);
      setError(err.message || 'Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold">
            {editingCategory ? 'Edit Category' : 'Create New Category'}
          </h2>
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
              Category Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Vegetables, Grains, Spices"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category Name (French)
            </label>
            <input
              type="text"
              value={nameFrench}
              onChange={(e) => setNameFrench(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Légumes, Céréales, Épices"
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
              rows={3}
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
              placeholder="https://example.com/image.jpg"
              disabled={loading}
            />
            {imageUrl && (
              <div className="mt-2 flex items-center gap-2">
                <img
                  src={imageUrl}
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
              {loading ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCategoryModal;
