import React, { useState } from "react";
import inventoryService from "../../services/inventoryService";
import type { Product } from "./ProductTypes";

interface BulkInventoryActionsProps {
  selectedCount: number;
  selectedProductIds: string[];
  allProducts: Product[];
  onActionComplete?: () => void;
}

type ActionMode = null | "restock" | "setQuantity";

const BulkInventoryActions: React.FC<BulkInventoryActionsProps> = ({
  selectedCount,
  selectedProductIds,
  allProducts,
  onActionComplete,
}) => {
  const [actionMode, setActionMode] = useState<ActionMode>(null);
  const [quantity, setQuantity] = useState<number>(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleDownloadBackup = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Prepare CSV data
      const headers = ["ID", "Product (English)", "Product (Local)", "Category", "Current Quantity", "Reorder Level", "Unit Type", "Price"];
      const rows = allProducts.map((prod) => [
        prod.id,
        prod.nameEnglish,
        prod.nameLocal,
        typeof prod.category === "object" && prod.category ? prod.category.name : "—",
        prod.inventory?.quantity || 0,
        prod.inventory?.reorderLevel || 10,
        prod.unitType,
        prod.pricePerUnit,
      ]);

      // Create CSV content
      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `inventory-backup-${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSuccess("✅ Inventory backup downloaded successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("❌ [BulkInventoryActions] Download failed:", err);
      setError(`Failed to download backup: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRestock = async () => {
    if (selectedCount === 0) {
      setError("Please select at least one product");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      console.log(`📦 [BulkInventoryActions] ${actionMode === "restock" ? "Adding" : "Setting"} ${quantity} units to ${selectedCount} products`);

      const productIds = selectedProductIds.map((id) => parseInt(id, 10));
      let successCount = 0;
      let failedCount = 0;

      for (const productId of productIds) {
        try {
          if (actionMode === "restock") {
            // Add quantity (incoming stock)
            await inventoryService.restock(productId, { quantity });
          } else if (actionMode === "setQuantity") {
            // Get current quantity and calculate difference
            const product = allProducts.find((p) => p.id.toString() === productId.toString());
            const currentQuantity = product?.inventory?.quantity || 0;
            const difference = quantity - currentQuantity;

            if (difference > 0) {
              // Add stock
              await inventoryService.restock(productId, { quantity: difference });
            } else if (difference < 0) {
              // Remove stock
              await inventoryService.recordMovement(productId, {
                type: "OUT",
                quantity: Math.abs(difference),
                reason: "Bulk inventory adjustment",
                reference: "Bulk set quantity",
              });
            }
          }
          successCount++;
        } catch (err) {
          console.error(`Failed to update product ${productId}:`, err);
          failedCount++;
        }
      }

      const message =
        failedCount === 0
          ? `✅ Successfully ${actionMode === "restock" ? "restocked" : "set quantity for"} ${successCount} products`
          : `⚠️ Updated ${successCount} products (${failedCount} failed)`;

      setSuccess(message);
      setActionMode(null);
      onActionComplete?.();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      console.error("❌ [BulkInventoryActions] Action failed:", err);
      setError(`Operation failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow border border-gray-100 p-4 mb-6">
      {/* Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <span className="text-red-700 text-sm font-medium flex-1">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600"
          >
            ✕
          </button>
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <span className="text-green-700 text-sm font-medium flex-1">{success}</span>
          <button
            onClick={() => setSuccess(null)}
            className="text-green-400 hover:text-green-600"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Selection Info */}
        <div>
          <span className="text-sm font-medium text-gray-700">
            {selectedCount > 0 ? (
              <>
                <span className="text-blue-600 font-semibold">{selectedCount}</span>
                <span className="text-gray-600"> product{selectedCount !== 1 ? "s" : ""} selected</span>
              </>
            ) : (
              <span className="text-gray-600">No products selected</span>
            )}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          {/* Download Backup */}
          <button
            onClick={handleDownloadBackup}
            disabled={loading || allProducts.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            ⬇ Backup
          </button>

          {/* Restock Button */}
          <button
            onClick={() => {
              if (selectedCount === 0) {
                setError("Please select at least one product");
                return;
              }
              setActionMode("restock");
            }}
            disabled={loading || selectedCount === 0}
            className="flex items-center gap-2 px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            + Add Stock
          </button>

          {/* Set Quantity Button */}
          <button
            onClick={() => {
              if (selectedCount === 0) {
                setError("Please select at least one product");
                return;
              }
              setActionMode("setQuantity");
            }}
            disabled={loading || selectedCount === 0}
            className="flex items-center gap-2 px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            = Set Quantity
          </button>
        </div>
      </div>

      {/* Action Dialog */}
      {actionMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {actionMode === "restock" ? "Add Stock to Selected Products" : "Set Quantity for Selected Products"}
            </h3>

            <p className="text-sm text-gray-600 mb-4">
              {actionMode === "restock"
                ? `Enter the quantity to add to each of the ${selectedCount} selected product${selectedCount !== 1 ? "s" : ""}.`
                : `Enter the quantity to set for each of the ${selectedCount} selected product${selectedCount !== 1 ? "s" : ""}.`}
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {actionMode === "restock" ? "Quantity to Add" : "New Quantity"}
              </label>
              <input
                type="number"
                min="1"
                max="999999"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setActionMode(null)}
                disabled={loading}
                className="flex-1 px-4 py-2 rounded border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleRestock}
                disabled={loading}
                className="flex-1 px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-50 transition"
              >
                {loading ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkInventoryActions;
