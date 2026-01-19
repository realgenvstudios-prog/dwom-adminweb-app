import React from "react";
import type { ProductCategory, InventoryStatus } from "./ProductTypes";

interface ProductsFilterBarProps {
  categories: ProductCategory[];
  category: string;
  status: string;
  stock: InventoryStatus | "All";
  search: string;
  onChange: (filters: { category: string; status: string; stock: InventoryStatus | "All"; search: string }) => void;
}

const statusOptions = ["All", "Active", "Inactive"];
const stockOptions: (InventoryStatus | "All")[] = ["All", "In stock", "Low", "Out of stock"];

const ProductsFilterBar: React.FC<ProductsFilterBarProps> = ({ categories, category, status, stock, search, onChange }) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center mb-4">
      <input
        className="border rounded-lg px-4 py-2 min-w-[200px] flex-1 text-base"
        placeholder="Search by name…"
        value={search}
        onChange={e => onChange({ category, status, stock, search: e.target.value })}
      />
      <select
        className="border rounded-lg px-4 py-2 min-w-[140px] text-base"
        value={status}
        onChange={e => onChange({ category, status: e.target.value, stock, search })}
      >
        {statusOptions.map(s => <option key={s}>{s}</option>)}
      </select>
      <select
        className="border rounded-lg px-4 py-2 min-w-[140px] text-base"
        value={stock}
        onChange={e => onChange({ category, status, stock: e.target.value as InventoryStatus | "All", search })}
      >
        {stockOptions.map(s => <option key={s}>{s}</option>)}
      </select>
      <select
        className="border rounded-lg px-4 py-2 min-w-[140px] text-base"
        value={category}
        onChange={e => onChange({ category: e.target.value, status, stock, search })}
      >
        <option value="All">All Categories</option>
        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
    </div>
  );
};

export default ProductsFilterBar;
