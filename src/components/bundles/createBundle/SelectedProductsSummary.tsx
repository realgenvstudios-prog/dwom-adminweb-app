import type { Product } from "../BundleTypes";
import type { BundleItem } from "./useBundleForm";

interface SelectedProductsSummaryProps {
  bundleItems: BundleItem[];
  availableProducts: Product[];
  onRemove: (productId: number) => void;
}

// The chip list of currently-selected products above the picker. Split
// out of the former monolithic CreateBundleModal.
export default function SelectedProductsSummary({ bundleItems, availableProducts, onRemove }: SelectedProductsSummaryProps) {
  return (
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
                onClick={() => onRemove(item.productId)}
                className="ml-1 text-red-400 hover:text-red-600 font-bold"
              >
                ×
              </button>
            </span>
          );
        })}
      </div>
    </div>
  );
}
