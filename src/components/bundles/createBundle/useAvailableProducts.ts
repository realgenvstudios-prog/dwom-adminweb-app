import { useEffect, useState } from "react";
import productsService from "../../../services/productsService";
import type { Product } from "../BundleTypes";
import type { Category } from "../../../services/productsService";

// The product picker's data: all products + the categories derived from
// them. Split out of the former monolithic CreateBundleModal.
export function useAvailableProducts(open: boolean) {
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const fetchProducts = async () => {
    try {
      const products = await productsService.getAll();
      setAvailableProducts(products as any);

      // Extract unique categories from products (since backend includes Category in each product)
      const catMap = new Map<number, Category>();
      (products as any[]).forEach((p: any) => {
        if (p.Category && p.Category.id && !catMap.has(p.Category.id)) {
          catMap.set(p.Category.id, { id: p.Category.id, name: p.Category.name, description: p.Category.description });
        } else if (p.categoryId && p.category && !catMap.has(p.categoryId)) {
          catMap.set(p.categoryId, { id: p.categoryId, name: p.category.name || p.category, description: '' });
        }
      });
      setCategories(Array.from(catMap.values()).sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  // Pre-fetch products on mount so they're ready instantly when modal opens
  useEffect(() => {
    fetchProducts();
  }, []);

  // Re-fetch only if we have no products yet (first load failed etc.) when
  // the modal opens.
  useEffect(() => {
    if (open && availableProducts.length === 0) {
      fetchProducts();
    }
  }, [open]);

  return { availableProducts, categories };
}
