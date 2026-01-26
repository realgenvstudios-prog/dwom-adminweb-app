import React from "react";
import type { Product } from "./ProductTypes";

interface ProductsTableProps {
  products: Product[];
  onRowClick: (product: Product) => void;
  sortBy: string;
  sortDir: "asc" | "desc";
  onSort: (col: string) => void;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  selectedProducts?: string[];
  onSelectionChange?: (productIds: string[]) => void;
  onDiscountChange?: (productId: number, discount: number) => void;
  discountUpdating?: boolean;
}

const ProductsTable: React.FC<ProductsTableProps> = ({ 
  products, 
  onRowClick, 
  sortBy, 
  sortDir, 
  onSort, 
  page, 
  pageSize, 
  total, 
  onPageChange,
  selectedProducts = [],
  onSelectionChange,
  onDiscountChange,
  discountUpdating,
}) => {
  const handleProductCheck = (productId: string) => {
    if (!onSelectionChange) return;
    if (selectedProducts.includes(productId)) {
      onSelectionChange(selectedProducts.filter(id => id !== productId));
    } else {
      onSelectionChange([...selectedProducts, productId]);
    }
  };

  const handleSelectPageProducts = () => {
    if (!onSelectionChange) return;
    const pageProductIds = products.map(p => p.id.toString());
    const newSelection = selectedProducts.filter(id => !pageProductIds.includes(id));
    if (newSelection.length === selectedProducts.length) {
      // All page products were unselected, so select them
      onSelectionChange([...selectedProducts, ...pageProductIds]);
    } else {
      // Some/all page products were selected, so deselect them
      onSelectionChange(newSelection);
    }
  };

  const pageProductIds = products.map(p => p.id.toString());
  const pageSelectedCount = pageProductIds.filter(id => selectedProducts.includes(id)).length;
  const isPageFullySelected = pageSelectedCount === products.length && products.length > 0;
  return (
    <div className="bg-white rounded-xl shadow border border-gray-100 overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-4 py-3 text-left w-12">
              <input 
                type="checkbox" 
                checked={isPageFullySelected}
                onChange={handleSelectPageProducts}
                className="rounded border-gray-300"
              />
            </th>
            <th className="px-4 py-3 text-left cursor-pointer" onClick={() => onSort("nameEnglish")}>Product {sortBy === "nameEnglish" && (sortDir === "asc" ? "▲" : "▼")}</th>
            <th className="px-4 py-3 text-left">Category</th>
            <th className="px-4 py-3 text-left">Unit</th>
            <th className="px-4 py-3 text-left cursor-pointer" onClick={() => onSort("pricePerUnit")}>Price (GHS) {sortBy === "pricePerUnit" && (sortDir === "asc" ? "▲" : "▼")}</th>
            <th className="px-4 py-3 text-left">Discount %</th>
            <th className="px-4 py-3 text-left">Inventory</th>
            <th className="px-4 py-3 text-left">Active</th>
            <th className="px-4 py-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map(product => (
            <tr key={product.id} className={`border-t hover:bg-gray-50 ${selectedProducts.includes(product.id.toString()) ? 'bg-blue-50' : ''}`}>
              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                <input 
                  type="checkbox"
                  checked={selectedProducts.includes(product.id.toString())}
                  onChange={() => handleProductCheck(product.id.toString())}
                  className="rounded border-gray-300"
                />
              </td>
              <td className="px-4 py-3 cursor-pointer" onClick={() => onRowClick(product)}>
                <div className="font-semibold text-gray-900">{product.nameEnglish}</div>
                <div className="text-xs text-gray-500">{product.nameLocal}</div>
              </td>
              <td className="px-4 py-3 cursor-pointer" onClick={() => onRowClick(product)}>
                <span className="text-gray-700">
                  {typeof product.category === 'object' && product.category ? 
                    product.category.name : 
                    (typeof (product as any).Category === 'object' && (product as any).Category?.name ? 
                      (product as any).Category.name : 
                      (product.category ? product.category : '—'))}
                </span>
              </td>
              <td className="px-4 py-3 cursor-pointer" onClick={() => onRowClick(product)}>{product.unitType}</td>
              <td className="px-4 py-3 cursor-pointer" onClick={() => onRowClick(product)}>GHS {typeof product.pricePerUnit === 'string' ? parseFloat(product.pricePerUnit).toFixed(2) : (product.pricePerUnit as number).toFixed(2)}</td>
              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={product.discount || 0}
                  onChange={(e) => onDiscountChange?.(product.id as number, parseFloat(e.target.value))}
                  disabled={discountUpdating}
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                  placeholder="0"
                />
              </td>
              <td className="px-4 py-3 cursor-pointer" onClick={() => onRowClick(product)}>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${product.inventoryStatus === "In stock" ? "bg-green-100 text-green-700" : product.inventoryStatus === "Low" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>{product.inventoryStatus}</span>
              </td>
              <td className="px-4 py-3 cursor-pointer" onClick={() => onRowClick(product)}>
                {product.active ? <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-semibold">Active</span> : <span className="px-2 py-1 rounded bg-gray-200 text-gray-600 text-xs font-semibold">Inactive</span>}
              </td>
              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                <button className="text-blue-600 hover:underline text-xs mr-2" onClick={() => onRowClick(product)}>Edit</button>
                <button className="text-gray-600 hover:underline text-xs" onClick={() => onRowClick(product)}>View</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Pagination */}
      <div className="flex justify-between items-center px-4 py-3 border-t bg-gray-50">
        <span className="text-sm text-gray-500">Page {page} of {Math.ceil(total / pageSize)}</span>
        <div className="flex gap-2">
          <button className="px-2 py-1 rounded bg-gray-200 text-gray-700 text-xs" disabled={page === 1} onClick={() => onPageChange(page - 1)}>Prev</button>
          <button className="px-2 py-1 rounded bg-gray-200 text-gray-700 text-xs" disabled={page === Math.ceil(total / pageSize)} onClick={() => onPageChange(page + 1)}>Next</button>
        </div>
      </div>
    </div>
  );
};

export default ProductsTable;
