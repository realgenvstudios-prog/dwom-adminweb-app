import React, { useState, useEffect } from 'react';
import CreateCategoryModal from './categories/CreateCategoryModal';
import categoriesService from '../services/categoriesService';
import type { Category } from '../services/categoriesService';

const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('📂 [CategoriesPage] Fetching categories');
      
      const data = await categoriesService.getAll();
      console.log('✅ [CategoriesPage] Categories loaded:', data.length);
      setCategories(data || []);
    } catch (err: any) {
      console.error('❌ [CategoriesPage] Failed to fetch categories:', err);
      setError(err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClick = () => {
    setEditingCategory(null);
    setModalOpen(true);
  };

  const handleEditClick = (category: Category) => {
    setEditingCategory(category);
    setModalOpen(true);
  };

  const handleDeleteClick = async (category: Category) => {
    if (confirm(`Are you sure you want to delete "${category.name}"?`)) {
      try {
        console.log(`🗑️ [CategoriesPage] Deleting category ${category.id}`);
        await categoriesService.delete(category.id);
        console.log('✅ [CategoriesPage] Category deleted');
        alert('Category deleted successfully!');
        await fetchCategories();
      } catch (err: any) {
        console.error('❌ [CategoriesPage] Failed to delete category:', err);
        alert(`Failed to delete category: ${err.message}`);
      }
    }
  };

  const handleCategoryCreated = async () => {
    await fetchCategories();
  };

  // Filter categories based on search
  const filtered = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
            <p className="text-gray-600 mt-1">Manage product categories</p>
          </div>
          <button
            onClick={handleCreateClick}
            className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
          >
            + Create Category
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="ml-3 text-gray-600">Loading categories...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-4 rounded-lg bg-red-50 text-red-700 mb-6">
            {error}
          </div>
        )}

        {/* Categories Table */}
        {!loading && !error && (
          <>
            {filtered.length === 0 ? (
              <div className="bg-white rounded-xl shadow border border-gray-100 p-12 text-center">
                <p className="text-gray-500 text-lg">
                  {categories.length === 0 ? 'No categories yet. Create your first one!' : 'No categories match your search.'}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Image</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Name</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Description</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Created</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((category) => (
                      <tr key={category.id} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-4">
                          {category.imageUrl ? (
                            <img
                              src={category.imageUrl}
                              alt={category.name}
                              className="w-12 h-12 rounded object-cover border border-gray-200"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-400 text-xs">No image</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">{category.name}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {category.description || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {category.createdAt ? new Date(category.createdAt).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(category);
                              }}
                              className="px-3 py-1 rounded text-sm font-medium text-blue-600 hover:bg-blue-50"
                            >
                              Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(category);
                              }}
                              className="px-3 py-1 rounded text-sm font-medium text-red-600 hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer Info */}
            <div className="mt-6 text-sm text-gray-600">
              Showing {filtered.length} of {categories.length} categories
            </div>
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      <CreateCategoryModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingCategory(null);
        }}
        onCategoryCreated={handleCategoryCreated}
        editingCategory={editingCategory}
      />
    </div>
  );
};

export default CategoriesPage;
