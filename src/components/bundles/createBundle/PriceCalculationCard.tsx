interface PriceCalculationCardProps {
  originalTotal: number;
  finalPrice: number;
  savingsAmount: number;
  discount: string;
}

// The "Price Calculation" summary card, shown once at least one product
// is selected. Split out of the former monolithic CreateBundleModal.
export default function PriceCalculationCard({ originalTotal, finalPrice, savingsAmount, discount }: PriceCalculationCardProps) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">💰 Price Calculation</h4>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Original Total:</span>
        <span className="font-medium">GHS {originalTotal.toFixed(2)}</span>
      </div>
      {parseFloat(discount) > 0 && (
        <div className="flex justify-between text-sm text-green-600">
          <span>Discount ({discount}%):</span>
          <span className="font-medium">- GHS {savingsAmount.toFixed(2)}</span>
        </div>
      )}
      <div className="border-t border-gray-300 pt-2 mt-2">
        <div className="flex justify-between text-lg font-bold">
          <span className="text-gray-800">Final Bundle Price:</span>
          <span className="text-blue-600">GHS {finalPrice.toFixed(2)}</span>
        </div>
      </div>
      {parseFloat(discount) > 0 && (
        <p className="text-xs text-green-600 mt-1">
          ✨ Customers save GHS {savingsAmount.toFixed(2)} ({discount}% off)
        </p>
      )}
    </div>
  );
}
