import React, { useState, useEffect } from "react";
import UpdateStockModal from "./warehouse/UpdateStockModal";
import StockMovementModal from "./warehouse/StockMovementModal";
import MovementHistoryModal from "./warehouse/MovementHistoryModal";
import EditThresholdsModal from "./warehouse/EditThresholdsModal";
import inventoryService from "../services/inventoryService";
import type { InventoryItem, InventoryStats } from "../services/inventoryService";

const WarehouseOperationsPage: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("stock");

  // Modal states
  const [updateStockModalOpen, setUpdateStockModalOpen] = useState(false);
  const [movementModalOpen, setMovementModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [editThresholdsModalOpen, setEditThresholdsModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedProductName, setSelectedProductName] = useState<string | undefined>();
  const [selectedProductStock, setSelectedProductStock] = useState<number | undefined>();
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("📦 [WarehouseOperationsPage] Fetching warehouse data");

      const [inventoryData, statsData] = await Promise.all([
        inventoryService.getAll(),
        inventoryService.getStats(),
      ]);

      console.log("✅ [WarehouseOperationsPage] Data loaded");
      
      // Enrich inventory with product names if not present
      const enrichedInventory = inventoryData.map((item: any) => ({
        ...item,
        productName: item.productName || item.Product?.nameEnglish || item.Product?.name || 'Unknown Product',
        minThreshold: item.minThreshold || item.reorderLevel || 0,
        maxThreshold: item.maxThreshold || item.reorderQuantity || 0,
        warehouseZone: item.warehouseZone || item.Zone || '-',
      }));

      setInventory(enrichedInventory || []);
      setStats(statsData);
    } catch (err: any) {
      console.error("❌ [WarehouseOperationsPage] Failed to fetch data:", err);
      setError(err.message || "Failed to load warehouse data");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStock = (product: InventoryItem) => {
    setSelectedProductId(product.productId);
    setSelectedProductName(product.productName);
    setSelectedProductStock(product.quantity);
    setUpdateStockModalOpen(true);
  };

  const handleRecordMovement = (product: InventoryItem) => {
    setSelectedProductId(product.productId);
    setSelectedProductName(product.productName);
    setSelectedProductStock(product.quantity);
    setMovementModalOpen(true);
  };

  const handleViewHistory = (product: InventoryItem) => {
    setSelectedProductId(product.productId);
    setSelectedProductName(product.productName);
    setHistoryModalOpen(true);
  };

  const handleEditThresholds = (product: InventoryItem) => {
    setSelectedProduct(product);
    setEditThresholdsModalOpen(true);
  };

  // Filter and sort inventory
  const filteredInventory = inventory
    .filter((item) =>
      (item.productName || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "stock":
          return b.quantity - a.quantity;
        case "name":
          return (a.productName || "").localeCompare(b.productName || "");
        case "status":
          const statusA = a.quantity === 0 ? 2 : a.quantity < a.minThreshold ? 1 : 0;
          const statusB = b.quantity === 0 ? 2 : b.quantity < b.minThreshold ? 1 : 0;
          return statusB - statusA;
        default:
          return 0;
      }
    });

  const getStockStatus = (quantity: number, minThreshold: number) => {
    if (quantity === 0) return { label: "Out", color: "bg-red-100 text-red-700" };
    if (quantity < minThreshold) return { label: "Low", color: "bg-yellow-100 text-yellow-700" };
    return { label: "In Stock", color: "bg-green-100 text-green-700" };
  };
  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Warehouse Operations</h1>
          <p className="text-gray-600 mt-1">Manage inventory and track stock movements</p>
        </div>

        {/* KPI Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="ml-3 text-gray-600">Loading warehouse data...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-lg bg-red-50 text-red-700 mb-6">{error}</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              <div className="bg-white rounded-xl shadow p-6">
                <p className="text-sm text-gray-600 mb-2">Total Quantity</p>
                <p className="text-4xl font-bold text-blue-600">{stats?.totalUnits || 0}</p>
                <p className="text-xs text-gray-500 mt-2">{stats?.totalProducts || 0} products tracked</p>
              </div>
              <div className="bg-white rounded-xl shadow p-6">
                <p className="text-sm text-gray-600 mb-2">Low Stock Items</p>
                <p className="text-4xl font-bold text-yellow-500">{stats?.lowStockItems || 0}</p>
                <p className="text-xs text-gray-500 mt-2">Below minimum threshold</p>
              </div>
              <div className="bg-white rounded-xl shadow p-6">
                <p className="text-sm text-gray-600 mb-2">Out of Stock</p>
                <p className="text-4xl font-bold text-red-500">{stats?.outOfStockItems || 0}</p>
                <p className="text-xs text-gray-500 mt-2">Unavailable products</p>
              </div>
              <div className="bg-white rounded-xl shadow p-6">
                <p className="text-sm text-gray-600 mb-2">Inventory Value</p>
                <p className="text-4xl font-bold text-green-600">GH₵ {(stats?.totalInventoryValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p className="text-xs text-gray-500 mt-2">Total value</p>
              </div>
            </div>

            {/* Inventory Table */}
            <section className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-bold mb-4">Inventory List</h2>
              
              <div className="flex flex-wrap gap-4 mb-6">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 min-w-[200px] border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="stock">Sort by Stock</option>
                  <option value="name">Sort by Name</option>
                  <option value="status">Sort by Status</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-gray-500 border-b bg-gray-50">
                      <th className="py-3 px-4 font-medium">Product Name</th>
                      <th className="py-3 px-4 font-medium">Current Stock</th>
                      <th className="py-3 px-4 font-medium">Min/Max</th>
                      <th className="py-3 px-4 font-medium">Zone</th>
                      <th className="py-3 px-4 font-medium">Status</th>
                      <th className="py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventory.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-500">
                          No inventory items found
                        </td>
                      </tr>
                    ) : (
                      filteredInventory.map((item) => {
                        const status = getStockStatus(item.quantity, item.minThreshold);
                        return (
                          <tr key={item.id} className="border-b hover:bg-gray-50">
                            <td className="py-4 px-4 font-medium">{item.productName || "N/A"}</td>
                            <td className="py-4 px-4 font-bold text-lg">{item.quantity}</td>
                            <td className="py-4 px-4 text-gray-600">
                              {item.minThreshold} / {item.maxThreshold}
                            </td>
                            <td className="py-4 px-4">{item.warehouseZone || "-"}</td>
                            <td className="py-4 px-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                                {status.label}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex gap-2 flex-wrap">
                                <button
                                  onClick={() => handleEditThresholds(item)}
                                  className="text-xs px-2 py-1 rounded bg-orange-100 text-orange-700 hover:bg-orange-200"
                                  title="Edit thresholds"
                                >
                                  Settings
                                </button>
                                <button
                                  onClick={() => handleUpdateStock(item)}
                                  className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                                  title="Update stock"
                                >
                                  Restock
                                </button>
                                <button
                                  onClick={() => handleRecordMovement(item)}
                                  className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200"
                                  title="Record movement"
                                >
                                  Move
                                </button>
                                <button
                                  onClick={() => handleViewHistory(item)}
                                  className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-700 hover:bg-purple-200"
                                  title="View history"
                                >
                                  History
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>

      {/* Modals */}
      <UpdateStockModal
        open={updateStockModalOpen}
        onClose={() => setUpdateStockModalOpen(false)}
        onSuccess={fetchData}
        productId={selectedProductId}
        productName={selectedProductName}
        currentStock={selectedProductStock}
      />

      <StockMovementModal
        open={movementModalOpen}
        onClose={() => setMovementModalOpen(false)}
        onSuccess={fetchData}
        productId={selectedProductId}
        productName={selectedProductName}
        currentStock={selectedProductStock}
      />

      <MovementHistoryModal
        open={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        productId={selectedProductId}
        productName={selectedProductName}
      />

      <EditThresholdsModal
        isOpen={editThresholdsModalOpen}
        onClose={() => setEditThresholdsModalOpen(false)}
        product={selectedProduct}
        onSuccess={fetchData}
      />
    </div>
  );
};

export default WarehouseOperationsPage;
