import { useCallback, useEffect, useState } from 'react';
import productsService from '../../services/productsService';
import categoriesService from '../../services/categoriesService';
import { logger } from '../../utils/logger';
import type { Product, ProductCategory } from './ProductTypes';

/** Products + categories for the Catalog. No fallback data: an empty catalog shows as empty. */
export function useCatalogData() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    try {
      const cats = await categoriesService.getAll();
      setCategories((cats ?? []).map((c: { id: number; name: string }) => ({ id: String(c.id), name: c.name })));
    } catch (err) {
      logger.error('❌ [CatalogPage] Failed to load categories:', err);
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

  return { products, categories, loading, error, refreshProducts: loadProducts, refreshCategories: loadCategories, patchProduct };
}
