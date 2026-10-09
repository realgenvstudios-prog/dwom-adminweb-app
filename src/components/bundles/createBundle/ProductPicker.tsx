import type { Product } from "../BundleTypes";
import type { Category } from "../../../services/productsService";
import type { BundleItem } from "./useBundleForm";

interface ProductPickerProps {
  availableProducts: Product[];
  categories: Category[];
  bundleItems: BundleItem[];
  selectedCategory: number | null;
  setSelectedCategory: (id: number | null) => void;
  productSearch: string;
  setProductSearch: (value: string) => void;
  loading: boolean;
  onToggleProduct: (productId: number) => void;
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onToggleVisibleOption: (productId: number, optionId: number, allOptionIds: number[]) => void;
}

// Category tabs + search + the checkbox list of products (with per-item
// quantity and variation-visibility controls once selected). Split out
// of the former monolithic CreateBundleModal.
export default function ProductPicker({
  availableProducts,
  categories,
  bundleItems,
  selectedCategory,
  setSelectedCategory,
  productSearch,
  setProductSearch,
  loading,
  onToggleProduct,
  onUpdateQuantity,
  onToggleVisibleOption,
}: ProductPickerProps) {
  const filtered = availableProducts.filter(product => {
    const matchesCategory = selectedCategory === null || (product as any).categoryId === selectedCategory || (product as any).Category?.id === selectedCategory;
    const matchesSearch = !productSearch.trim() ||
      product.nameEnglish?.toLowerCase().includes(productSearch.toLowerCase()) ||
      product.nameLocal?.toLowerCase().includes(productSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
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
        ) : filtered.length === 0 ? (
          <p className="text-gray-500 text-sm py-4 text-center">
            No products match your search{selectedCategory ? ' in this category' : ''}
          </p>
        ) : (
          filtered.map((product) => {
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
                    onChange={() => onToggleProduct(product.id as any)}
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
                  <div className="mt-2 ml-6 space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-600">Qty:</label>
                      <input
                        type="number"
                        min="1"
                        value={bundleItem.quantity}
                        onChange={(e) => onUpdateQuantity(product.id as any, parseInt(e.target.value))}
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={loading}
                      />
                      <span className="text-xs text-gray-500">
                        = GHS {(price * bundleItem.quantity).toFixed(2)}
                      </span>
                    </div>

                    {/* This product's own variations — pick which stay visible in this bundle */}
                    {(product as any).VariationGroup && (product as any).VariationGroup.length > 0 && (() => {
                      const groups = (product as any).VariationGroup;
                      const allOptionIds = groups.flatMap((g: any) => g.options.map((o: any) => o.id));
                      return (
                        <div className="pt-2 border-t border-gray-100 space-y-2">
                          <p className="text-xs font-medium text-gray-500">Variations visible in this bundle:</p>
                          {groups.map((group: any) => (
                            <div key={group.id}>
                              <p className="text-xs text-gray-500">{group.name}</p>
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {group.options.map((opt: any) => {
                                  const visible = !bundleItem.visibleVariationOptionIds ||
                                    bundleItem.visibleVariationOptionIds.length === 0 ||
                                    bundleItem.visibleVariationOptionIds.includes(opt.id);
                                  return (
                                    <label
                                      key={opt.id}
                                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs border cursor-pointer ${
                                        visible ? 'bg-blue-50 border-blue-300 text-blue-800' : 'bg-gray-50 border-gray-200 text-gray-400'
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={visible}
                                        onChange={() => onToggleVisibleOption(product.id as any, opt.id, allOptionIds)}
                                        disabled={loading}
                                        className="w-3 h-3 accent-blue-600"
                                      />
                                      {opt.label}
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
