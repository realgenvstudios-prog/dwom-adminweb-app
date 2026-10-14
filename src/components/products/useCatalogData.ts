import { useCallback, useEffect, useMemo, useState } from 'react';
import productsService from '../../services/productsService';
import categoriesService, { type Category } from '../../services/categoriesService';
import { logger } from '../../utils/logger';
import type { Product, ProductCategory } from './ProductTypes';

/** GET /categories includes every product in the category — archived ones too — and sortOrder. */
export interface CategoryRecord extends Category {
  sortOrder?: number;
  Product?: Array<{ id: number; active: boolean }>;
}

/** Products + categories for the Catalog. No fallback data: an empty catalog shows as empty. */
export function useCatalogData() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryRecords, setCategoryRecords] = useState<CategoryRecord[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    try {
      setCategoriesError(null);
      setCategoryRecords(((await categoriesService.getAll()) ?? []) as CategoryRecord[]);
    } catch (err) {
      logger.error('❌ [CatalogPage] Failed to load categories:', err);
      setCategoriesError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      setError(null);
      const list = await productsService.getAll();
      setProducts((list ?? []) as unknown as Product[]);
    } catch (err) {
      logger.error('❌ [CatalogPage] Failed to load products:', err);
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      void loadProducts();
      void loadCategories();
    }, 0);
    return () => clearTimeout(t);
  }, [loadProducts, loadCategories]);

  const patchProduct = useCallback((id: Product['id'], patch: Partial<Product>) => {
    setProducts((prev) => prev.map((p) => (String(p.id) === String(id) ? { ...p, ...patch } : p)));
  }, []);

  const categories: ProductCategory[] = useMemo(
    () => categoryRecords.map((c) => ({ id: String(c.id), name: c.name })),
    [categoryRecords],
  );

  return {
    products,
    categories,
    categoryRecords,
    loading,
    error,
    categoriesLoading,
    categoriesError,
    refreshProducts: loadProducts,
    refreshCategories: loadCategories,
    patchProduct,
  };
}
