import { useState, type FormEvent } from "react";
import suppliersService from "../../services/suppliersService";
import type { Supplier, SupplierProductLink } from "../../services/suppliersService";
import productsService from "../../services/productsService";
import type { Product } from "../../services/productsService";
import { logger } from '../../utils/logger';

export const emptySupplierForm = { name: "", contactName: "", phone: "", location: "", notes: "" };

// Supplier list + the add/edit form, plus which products each supplier
// provides (ProductSupplier links) — independent of logging a purchase.
// Split out of the former monolithic SuppliersPage.
export function useSuppliersData() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [supplierForm, setSupplierForm] = useState(emptySupplierForm);
  const [editingSupplierId, setEditingSupplierId] = useState<number | null>(null);
  const [savingSupplier, setSavingSupplier] = useState(false);

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [linkedProducts, setLinkedProducts] = useState<SupplierProductLink[]>([]);
  const [linkingProductId, setLinkingProductId] = useState<number | null>(null);

  const loadAllProducts = async () => {
    try {
      setAllProducts(await productsService.getAll());
    } catch (err) {
      logger.error("❌ [SuppliersPage] Failed to load products:", err);
    }
  };

  const loadSuppliers = async () => {
    try {
      setLoadingSuppliers(true);
      const data = await suppliersService.getAll(true); // include inactive so they're still visible in the management table
      setSuppliers(data);
    } catch (err) {
      logger.error("❌ [SuppliersPage] Failed to load suppliers:", err);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const resetSupplierForm = () => {
    setSupplierForm(emptySupplierForm);
    setEditingSupplierId(null);
    setLinkedProducts([]);
  };

  const handleSaveSupplier = async (e: FormEvent) => {
    e.preventDefault();
    if (!supplierForm.name.trim()) return;
    try {
      setSavingSupplier(true);
      if (editingSupplierId) {
        await suppliersService.update(editingSupplierId, supplierForm);
      } else {
        await suppliersService.create(supplierForm);
      }
      resetSupplierForm();
      await loadSuppliers();
    } catch (err: any) {
      alert(err.message || "Failed to save supplier");
    } finally {
      setSavingSupplier(false);
    }
  };

  const handleEditSupplier = async (s: Supplier) => {
    setEditingSupplierId(s.id);
    setSupplierForm({
      name: s.name,
      contactName: s.contactName || "",
      phone: s.phone || "",
      location: s.location || "",
      notes: s.notes || "",
    });
    try {
      const detail = await suppliersService.getById(s.id);
      setLinkedProducts(detail.ProductSupplier);
    } catch (err) {
      logger.error("❌ [SuppliersPage] Failed to load supplier's products:", err);
      setLinkedProducts([]);
    }
  };

  const handleToggleProductLink = async (productId: number) => {
    if (!editingSupplierId) return;
    const isLinked = linkedProducts.some((l) => l.productId === productId);
    try {
      setLinkingProductId(productId);
      if (isLinked) {
        await suppliersService.unlinkProduct(editingSupplierId, productId);
      } else {
        await suppliersService.linkProduct(editingSupplierId, productId);
      }
      const detail = await suppliersService.getById(editingSupplierId);
      setLinkedProducts(detail.ProductSupplier);
    } catch (err: any) {
      alert(err.message || "Failed to update product link");
    } finally {
      setLinkingProductId(null);
    }
  };

  const handleDeactivateSupplier = async (s: Supplier) => {
    if (!window.confirm(`Deactivate ${s.name}? They'll be hidden from new purchases, but their history is kept.`)) return;
    try {
      await suppliersService.remove(s.id);
      await loadSuppliers();
    } catch (err: any) {
      alert(err.message || "Failed to deactivate supplier");
    }
  };

  return {
    suppliers,
    loadingSuppliers,
    supplierForm,
    setSupplierForm,
    editingSupplierId,
    savingSupplier,
    loadSuppliers,
    resetSupplierForm,
    handleSaveSupplier,
    handleEditSupplier,
    handleDeactivateSupplier,
    allProducts,
    loadAllProducts,
    linkedProducts,
    linkingProductId,
    handleToggleProductLink,
  };
}
