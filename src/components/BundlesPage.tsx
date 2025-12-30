import React, { useState, useEffect } from 'react';
import CreateBundleModal from './bundles/CreateBundleModal';
import BundleDetailsModal from './bundles/BundleDetailsModal';
import bundlesService from '../services/bundlesService';
import type { Bundle } from '../services/bundlesService';

const BundlesPage: React.FC = () => {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedBundleId, setSelectedBundleId] = useState<number | null>(null);
  const [editingBundle, setEditingBundle] = useState<Bundle | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch bundles on mount
  useEffect(() => {
    fetchBundles();
  }, []);

  const fetchBundles = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('📦 [BundlesPage] Fetching bundles');
      
      const data = await bundlesService.getAll();
      console.log('✅ [BundlesPage] Bundles loaded:', data.length);
      setBundles(data || []);
    } catch (err: any) {
      console.error('❌ [BundlesPage] Failed to fetch bundles:', err);
      setError(err.message || 'Failed to load bundles');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClick = () => {
    setEditingBundle(null);
    setModalOpen(true);
  };

  const handleEditClick = (bundle: Bundle) => {
    setEditingBundle(bundle);
    setModalOpen(true);
  };

  const handleViewClick = (bundle: Bundle) => {
    setSelectedBundleId(bundle.id);
    setDetailsModalOpen(true);
  };

  const handleDeleteClick = async (bundle: Bundle) => {
    if (confirm(`Are you sure you want to delete "${bundle.name}"?`)) {
      try {
        console.log(`🗑️ [BundlesPage] Deleting bundle ${bundle.id}`);
        await bundlesService.delete(bundle.id);
        console.log('✅ [BundlesPage] Bundle deleted');
        alert('Bundle deleted successfully!');
        await fetchBundles();
      } catch (err: any) {
        console.error('❌ [BundlesPage] Failed to delete bundle:', err);
        alert(`Failed to delete bundle: ${err.message}`);
      }
    }
  };

  const handleBundleCreated = async () => {
    await fetchBundles();
  };

  // Filter bundles based on search
  const filtered = bundles.filter(bundle =>
    bundle.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bundles</h1>
            <p className="text-gray-600 mt-1">Create and manage product bundles</p>
          </div>
          <button
            onClick={handleCreateClick}
            className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
          >
            + Create Bundle
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search bundles..."
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
            <p className="ml-3 text-gray-600">Loading bundles...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-4 rounded-lg bg-red-50 text-red-700 mb-6">
            {error}
          </div>
        )}

        {/* Bundles Grid */}
        {!loading && !error && (
          <>
            {filtered.length === 0 ? (
              <div className="bg-white rounded-xl shadow border border-gray-100 p-12 text-center">
                <p className="text-gray-500 text-lg">
                  {bundles.length === 0 ? 'No bundles yet. Create your first one!' : 'No bundles match your search.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((bundle) => (
                  <div
                    key={bundle.id}
                    className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {/* Image */}
                    {bundle.imageUrl && (
                      <img
                        src={bundle.imageUrl}
                        alt={bundle.name}
                        className="h-72 w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}

                    <div className="p-6">
                      <div className="mb-4">
                        <h3 className="text-xl font-semibold text-gray-900">{bundle.name}</h3>
                        {bundle.description && (
                          <p className="text-sm text-gray-600 mt-1">{bundle.description}</p>
                        )}
                      </div>

                      {/* Price and Discount */}
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="p-2 bg-blue-50 rounded">
                          <p className="text-xs text-gray-600">Price</p>
                          <p className="text-lg font-bold text-blue-700">GHS {bundle.price?.toFixed(2)}</p>
                        </div>
                        {bundle.discount > 0 && (
                          <div className="p-2 bg-green-50 rounded">
                            <p className="text-xs text-gray-600">Discount</p>
                            <p className="text-lg font-bold text-green-700">{bundle.discount}%</p>
                          </div>
                        )}
                      </div>

                      {/* Metadata */}
                      {bundle.createdAt && (
                        <p className="text-xs text-gray-500 mb-4">
                          Created: {new Date(bundle.createdAt).toLocaleDateString()}
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-4 border-t">
                        <button
                          onClick={() => handleViewClick(bundle)}
                          className="flex-1 px-3 py-2 rounded text-sm font-medium text-purple-600 hover:bg-purple-50 transition-colors"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleEditClick(bundle)}
                          className="flex-1 px-3 py-2 rounded text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(bundle)}
                          className="flex-1 px-3 py-2 rounded text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Footer Info */}
            <div className="mt-6 text-sm text-gray-600">
              Showing {filtered.length} of {bundles.length} bundles
            </div>
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      <CreateBundleModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingBundle(null);
        }}
        onBundleCreated={handleBundleCreated}
        editingBundle={editingBundle}
      />

      {/* Details Modal */}
      <BundleDetailsModal
        open={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedBundleId(null);
        }}
        bundleId={selectedBundleId}
      />
    </div>
  );
};

export default BundlesPage;
