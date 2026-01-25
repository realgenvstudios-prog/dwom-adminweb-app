import React, { useState, useEffect } from 'react';
import seasonalService from '../services/seasonalService';
import productsService from '../services/productsService';

interface Product {
  id: number;
  nameEnglish: string;
  nameLocal: string;
  price: number;
  pricePerUnit: number;
  seasonal: boolean;
  seasonalDiscount: number;
  imageUrl?: string;
}

interface SeasonalConfig {
  bannerImageUrls?: string[];
  rotationFrequency: 'daily' | 'weekly' | 'monthly';
  featuredProductId: number;
}

const SeasonalProductsPage: React.FC = () => {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [seasonalProducts, setSeasonalProducts] = useState<Product[]>([]);
  const [config, setConfig] = useState<SeasonalConfig>({
    bannerImageUrls: [],
    rotationFrequency: 'daily',
    featuredProductId: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [bannerUrls, setBannerUrls] = useState<string[]>([]);
  const [newBannerUrl, setNewBannerUrl] = useState<string>('');

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all products and seasonal config
      const [allProds, seasonalProds, seasonalConfig] = await Promise.all([
        productsService.getAll(),
        seasonalService.getSeasonalProducts(),
        seasonalService.getSeasonalConfig(),
      ]);

      setAllProducts(allProds || []);
      setSeasonalProducts(seasonalProds || []);
      setConfig(seasonalConfig);
      setBannerUrls(seasonalConfig?.bannerImageUrls || []);
    } catch (err: any) {
      console.error('Failed to fetch seasonal data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleBannerUrlChange = (urls: string[]) => {
    setBannerUrls(urls);
    setConfig({
      ...config,
      bannerImageUrls: urls,
    });
  };

  const handleAddBannerUrl = () => {
    if (newBannerUrl.trim()) {
      const updatedUrls = [...bannerUrls, newBannerUrl.trim()];
      handleBannerUrlChange(updatedUrls);
      setNewBannerUrl('');
    }
  };

  const handleRemoveBannerUrl = (index: number) => {
    const updatedUrls = bannerUrls.filter((_, i) => i !== index);
    handleBannerUrlChange(updatedUrls);
  };

  const handleToggleSeasonal = async (productId: number, isCurrentlySeasonal: boolean) => {
    try {
      setSaving(true);
      const product = allProducts.find(p => p.id === productId);
      if (!product) {
        setError('Product not found');
        return;
      }

      // Toggle seasonal status
      await seasonalService.toggleSeasonalStatus(
        productId,
        !isCurrentlySeasonal,
        product.seasonalDiscount || 0
      );

      // Update local state immediately
      setAllProducts(allProducts.map(p =>
        p.id === productId ? { ...p, seasonal: !isCurrentlySeasonal } : p
      ));

      // Refresh data from server
      await fetchData();
    } catch (err: any) {
      console.error('Failed to toggle seasonal status:', err);
      setError(err.message || 'Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscountChange = async (productId: number, discount: number) => {
    try {
      setSaving(true);
      await seasonalService.updateSeasonalDiscount(productId, discount);
      
      // Update local state
      setAllProducts(allProducts.map(p =>
        p.id === productId ? { ...p, seasonalDiscount: discount } : p
      ));
    } catch (err: any) {
      console.error('Failed to update discount:', err);
      setError(err.message || 'Failed to update discount');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      setSaving(true);
      const updateData: any = {
        rotationFrequency: config.rotationFrequency,
        featuredProductId: config.featuredProductId,
        bannerImageUrls: bannerUrls,
      };

      await seasonalService.updateSeasonalConfig(updateData);
      setError(null);
      alert('Configuration saved successfully!');
    } catch (err: any) {
      console.error('Failed to save configuration:', err);
      setError(err.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading seasonal products...</div>;
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Seasonal Products Management</h1>
        <p className="text-gray-600">Manage your DWOM Special seasonal products and featured items</p>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-lg mb-6 text-red-700">
          {error}
        </div>
      )}

      {/* Configuration Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Configuration</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Banner URLs Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Banner Images (Multiple) - Add Cloudinary URLs
            </label>
            <div className="space-y-2 mb-4">
              {bannerUrls.map((url, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="flex-1">
                    <div className="text-xs text-gray-600 truncate">{url}</div>
                    <img
                      src={url}
                      alt={`Banner ${index + 1}`}
                      className="w-20 h-12 object-cover rounded border border-gray-300 mt-1"
                      onError={() => console.error(`Failed to load banner ${index + 1}`)}
                    />
                  </div>
                  <button
                    onClick={() => handleRemoveBannerUrl(index)}
                    className="text-red-600 hover:text-red-800 font-medium text-sm mt-1"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newBannerUrl}
                onChange={(e) => setNewBannerUrl(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddBannerUrl()}
                placeholder="Paste Cloudinary URL..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
              />
              <button
                onClick={handleAddBannerUrl}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 text-sm font-medium"
              >
                Add
              </button>
            </div>
          </div>

          {/* Rotation Frequency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rotation Frequency
            </label>
            <select
              value={config.rotationFrequency}
              onChange={(e) =>
                setConfig({
                  ...config,
                  rotationFrequency: e.target.value as 'daily' | 'weekly' | 'monthly',
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {/* Featured Product */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Featured Product
            </label>
            <select
              value={config.featuredProductId}
              onChange={(e) =>
                setConfig({
                  ...config,
                  featuredProductId: parseInt(e.target.value),
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
            >
              <option value={0}>Auto-rotate (Random)</option>
              {seasonalProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.nameEnglish}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleSaveConfig}
          disabled={saving}
          className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900">
            Products ({allProducts.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Product Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Price
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                  In Season
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Seasonal Discount %
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {allProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {product.imageUrl && (
                        <img
                          src={product.imageUrl}
                          alt={product.nameEnglish}
                          className="w-10 h-10 object-cover rounded"
                        />
                      )}
                      <div>
                        <div className="font-medium text-gray-900">
                          {product.nameEnglish}
                        </div>
                        <div className="text-sm text-gray-500">
                          {product.nameLocal}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-900">
                    GHS {product.pricePerUnit.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={product.seasonal}
                        onChange={() =>
                          handleToggleSeasonal(product.id, product.seasonal)
                        }
                        disabled={saving}
                        className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                    </label>
                  </td>
                  <td className="px-6 py-4">
                    {product.seasonal && (
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={product.seasonalDiscount}
                        onChange={(e) =>
                          handleDiscountChange(
                            product.id,
                            parseFloat(e.target.value)
                          )
                        }
                        disabled={saving}
                        className="w-20 px-3 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-red-500 outline-none"
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SeasonalProductsPage;
