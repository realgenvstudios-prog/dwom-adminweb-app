import React, { useState, useEffect } from "react";
import ProductsFilterBar from "./products/ProductsFilterBar";
import ProductsTable from "./products/ProductsTable";
import ProductDetailsPanel from "./products/ProductDetailsPanel";
import CreateProductModal from "./products/CreateProductModal";
import productsService from "../services/productsService";
import categoriesService from "../services/categoriesService";
import type { Product, ProductCategory, InventoryStatus } from "./products/ProductTypes";

// Mock data - Keep for fallback
const mockCategories: ProductCategory[] = [
  { id: "cat1", name: "Vegetables" },
  { id: "cat2", name: "Grains" },
  { id: "cat3", name: "Spices" },
  { id: "cat4", name: "Bundles" },
];

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>(mockCategories);
  const [filters, setFilters] = useState({ category: "All", status: "All", stock: "All", search: "" });
  const [sortBy, setSortBy] = useState("nameEnglish");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 10;

  // Fetch products and categories on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('📦 [ProductsPage] Fetching products and categories from backend');
        
        // Fetch both in parallel
        const [productsData, categoriesData] = await Promise.all([
          productsService.getAll(),
          categoriesService.getAll(),
        ]);
        
        console.log('✅ [ProductsPage] Products loaded:', productsData.length);
        console.log('✅ [ProductsPage] Categories loaded:', categoriesData.length);
        
        setProducts(productsData || []);
        if (categoriesData && categoriesData.length > 0) {
          // Map backend categories to ProductCategory type
          const mappedCategories: ProductCategory[] = categoriesData.map((cat: any) => ({
            id: cat.id.toString(),
            name: cat.name,
          }));
          setCategories(mappedCategories);
        }
      } catch (err: any) {
        console.error('❌ [ProductsPage] Failed to fetch products:', err);
        setError(err.message || 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Refresh products list
  const refreshProducts = async () => {
    try {
      setLoading(true);
      const productsData = await productsService.getAll();
      setProducts(productsData || []);
      console.log('✅ [ProductsPage] Products refreshed');
    } catch (err) {
      console.error('❌ [ProductsPage] Failed to refresh products:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter logic
  let filtered = products.filter(p => {
    // Category filter - handle both object and string/number category
    let categoryMatch = filters.category === "All";
    if (!categoryMatch && filters.category !== "All") {
      if (typeof p.category === 'object' && p.category?.id) {
        categoryMatch = p.category.id.toString() === filters.category;
      } else if (typeof p.category === 'string' || typeof p.category === 'number') {
        categoryMatch = p.category.toString() === filters.category;
      }
    }
    
    const statusMatch = filters.status === "All" || (filters.status === "Active" ? p.active : !p.active);
    const searchMatch = p.nameEnglish.toLowerCase().includes(filters.search.toLowerCase()) ||
      p.nameLocal.toLowerCase().includes(filters.search.toLowerCase());
    
    return categoryMatch && statusMatch && searchMatch;
  });
  
  // Sort logic
  filtered = filtered.sort((a, b) => {
    if (sortBy === "nameEnglish") {
      return sortDir === "asc"
        ? a.nameEnglish.localeCompare(b.nameEnglish)
        : b.nameEnglish.localeCompare(a.nameEnglish);
    }
    if (sortBy === "pricePerUnit") {
      const priceA = typeof a.pricePerUnit === 'string' ? parseFloat(a.pricePerUnit) : a.pricePerUnit;
      const priceB = typeof b.pricePerUnit === 'string' ? parseFloat(b.pricePerUnit) : b.pricePerUnit;
      return sortDir === "asc" ? priceA - priceB : priceB - priceA;
    }
    return 0;
  });
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4">
      <div className="max-w-screen-2xl mx-auto">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Products</h1>
            <div className="text-sm text-gray-500">Manage all DWOM grocery products</div>
          </div>
          <div className="flex gap-2 mt-3 sm:mt-0">
            <button 
              onClick={() => setCreateModalOpen(true)}
              className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 text-sm"
            >
              Add New Product
            </button>
            <button className="px-4 py-2 rounded bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 text-sm">Bulk Upload (CSV)</button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-medium">❌ {error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="ml-3 text-gray-600">Loading products...</p>
          </div>
        )}

        {/* Content */}
        {!loading && (
          <>
            {/* Filter Bar */}
            <ProductsFilterBar
              categories={categories}
              status={filters.status}
              stock={filters.stock as InventoryStatus | "All"}
              search={filters.search}
              onChange={f => { setFilters({ ...filters, ...f }); setPage(1); }}
            />
            {/* Table */}
            <ProductsTable
              products={paged}
              onRowClick={product => { setSelectedProduct(product); setDetailsOpen(true); }}
              sortBy={sortBy}
              sortDir={sortDir}
              onSort={col => {
                if (sortBy === col) setSortDir(sortDir === "asc" ? "desc" : "asc");
                else { setSortBy(col); setSortDir("asc"); }
              }}
              page={page}
              pageSize={pageSize}
              total={filtered.length}
              onPageChange={setPage}
            />
          </>
        )}

        {/* Details Panel */}
        <ProductDetailsPanel 
          product={selectedProduct} 
          open={detailsOpen} 
          onClose={() => setDetailsOpen(false)}
          onProductDeleted={() => {
            console.log('✅ [ProductsPage] Product deleted, refreshing list');
            refreshProducts();
            setSelectedProduct(null);
          }}
          onProductUpdated={() => {
            console.log('✅ [ProductsPage] Product updated, refreshing list');
            refreshProducts();
          }}
          categories={categories}
        />

        {/* Create Product Modal */}
        <CreateProductModal 
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onProductCreated={() => {
            console.log('✅ [ProductsPage] New product created, refreshing list');
            setCreateModalOpen(false);
            refreshProducts();
          }}
          categories={categories}
        />
      </div>
    </div>
  );
};

export default ProductsPage;

