import React, { useEffect } from "react";
import { useSuppliersData } from "../suppliers/useSuppliersData";
import SupplierForm from "../suppliers/SupplierForm";
import SuppliersTable from "../suppliers/SuppliersTable";

// Supplier roster + which products each one provides — a direct link,
// independent of ever logging a purchase (cost lives on the product
// itself, via the Finance hub's Product Costs tab). Folded into Warehouse
// Operations since suppliers are a sourcing concern, not a top-level nav
// item on their own.
const SuppliersTab: React.FC = () => {
  const {
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
  } = useSuppliersData();

  useEffect(() => {
    loadSuppliers();
    loadAllProducts();
  }, []);

  return (
    <>
      <p className="text-gray-600 mb-6">Who you buy from, and which products each one provides.</p>

      <SupplierForm
        editingSupplierId={editingSupplierId}
        supplierForm={supplierForm}
        setSupplierForm={setSupplierForm}
        savingSupplier={savingSupplier}
        onSubmit={handleSaveSupplier}
        onCancel={resetSupplierForm}
        allProducts={allProducts}
        linkedProducts={linkedProducts}
        linkingProductId={linkingProductId}
        onToggleProductLink={handleToggleProductLink}
      />

      <SuppliersTable
        suppliers={suppliers}
        loadingSuppliers={loadingSuppliers}
        onEdit={handleEditSupplier}
        onDeactivate={handleDeactivateSupplier}
      />
    </>
  );
};

export default SuppliersTab;
