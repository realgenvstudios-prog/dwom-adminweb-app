import React, { useState, useEffect } from "react";
import dashboardService, { type PopularProduct } from "../services/dashboardService";

const PopularItems: React.FC = () => {
  const [products, setProducts] = useState<PopularProduct[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPopularProducts();
  }, []);

  const fetchPopularProducts = async () => {
    try {
      setLoading(true);
      const popularProducts = await dashboardService.getPopularProducts(4);
      setProducts(popularProducts);
    } catch (error) {
      console.error("Failed to fetch popular products:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-10">
      <h3 className="text-2xl font-semibold mb-6">Popular Items</h3>
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {products.length > 0 ? (
            products.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow p-4 border">
                <div className="w-full h-16 bg-gradient-to-r from-orange-200 to-orange-100 rounded mb-3 flex items-center justify-center">
                  <span className="text-2xl">🥕</span>
                </div>
                <h4 className="font-medium text-sm">{product.nameEnglish}</h4>
                <p className="text-xs text-gray-500 mt-1">{product.quantity} sold</p>
                <p className="text-xs font-semibold text-green-600 mt-1">GH₵ {product.revenue.toFixed(2)}</p>
              </div>
            ))
          ) : (
            <div className="col-span-4 text-center py-8 text-gray-500">
              No products available yet
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PopularItems;
