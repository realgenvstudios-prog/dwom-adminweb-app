import React, { useState, useEffect } from "react";
import adminApiClient from "../services/apiClient";

interface Product {
  id: number;
  nameEnglish: string;
  quantity: number;
}

interface LowStockInventory {
  id: number;
  quantity: number;
  Product?: {
    id: number;
    nameEnglish: string;
    imageUrl?: string;
  };
}

const InventoryAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInventoryAlerts();
  }, []);

  const fetchInventoryAlerts = async () => {
    try {
      setLoading(true);

      // Use backend low-stock endpoint (already computed server-side)
      const response = (await adminApiClient.get(
        `/admin/dashboard/low-stock?limit=3`
      )) as any;

      const lowStock = (Array.isArray(response) ? response : response?.data || []) as LowStockInventory[];

      const mapped: Product[] = lowStock
        .map((inv) => ({
          id: inv.Product?.id ?? inv.id,
          nameEnglish: inv.Product?.nameEnglish ?? 'Unknown',
          quantity: inv.quantity ?? 0,
        }))
        .slice(0, 3);

      setAlerts(mapped);
    } catch (error) {
      console.error("Failed to fetch inventory alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAlertStatus = (quantity: number): string => {
    return quantity === 0 ? "Out of Stock" : quantity <= 5 ? "Critical" : "Low";
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "Out of Stock":
        return "bg-red-100 text-red-600";
      case "Critical":
        return "bg-orange-100 text-orange-600";
      default:
        return "bg-blue-100 text-blue-600";
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 mb-6 border">
      <h3 className="text-lg font-semibold mb-4">Inventory Alerts</h3>
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : (
        <ul className="space-y-2">
          {alerts.length > 0 ? (
            alerts.map((product) => (
              <li key={product.id} className="flex items-center justify-between">
                <span className="text-sm">{product.nameEnglish}</span>
                <span className={`text-xs px-2 py-1 rounded font-medium ${getStatusColor(getAlertStatus(product.quantity))}`}>
                  {getAlertStatus(product.quantity)} ({product.quantity})
                </span>
              </li>
            ))
          ) : (
            <li className="text-sm text-gray-500">All products in stock</li>
          )}
        </ul>
      )}
    </div>
  );
};

export default InventoryAlerts;
