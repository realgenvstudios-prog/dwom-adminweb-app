import { useState, type FormEvent } from "react";
import suppliersService from "../../services/suppliersService";
import type { Supplier } from "../../services/suppliersService";

export const emptySupplierForm = { name: "", contactName: "", phone: "", location: "", notes: "" };

// Supplier list + the add/edit form. Split out of the former monolithic
// SuppliersPage.
export function useSuppliersData() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [supplierForm, setSupplierForm] = useState(emptySupplierForm);
  const [editingSupplierId, setEditingSupplierId] = useState<number | null>(null);
  const [savingSupplier, setSavingSupplier] = useState(false);

  const loadSuppliers = async () => {
    try {
      setLoadingSuppliers(true);
      const data = await suppliersService.getAll(true); // include inactive so they're still visible in the management table
      setSuppliers(data);
    } catch (err) {
      console.error("❌ [SuppliersPage] Failed to load suppliers:", err);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const resetSupplierForm = () => {
    setSupplierForm(emptySupplierForm);
    setEditingSupplierId(null);
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

  const handleEditSupplier = (s: Supplier) => {
    setEditingSupplierId(s.id);
    setSupplierForm({
      name: s.name,
      contactName: s.contactName || "",
      phone: s.phone || "",
      location: s.location || "",
      notes: s.notes || "",
    });
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
  };
}
