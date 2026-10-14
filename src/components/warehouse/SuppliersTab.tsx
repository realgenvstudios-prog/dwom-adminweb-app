import React, { useState, useEffect } from "react";
import { useSuppliersData } from "../suppliers/useSuppliersData";
import { usePurchaseForm } from "../suppliers/usePurchaseForm";
import { usePurchaseHistory } from "../suppliers/usePurchaseHistory";
import RecordPurchaseForm from "../suppliers/RecordPurchaseForm";
import PurchaseHistoryTable from "../suppliers/PurchaseHistoryTable";
import SupplierForm from "../suppliers/SupplierForm";
import SuppliersTable from "../suppliers/SuppliersTable";

// Supplier roster + purchase recording — folded into Warehouse Operations
// since recording a purchase already updates Inventory in the same
// transaction (see procurement.service.ts). Split out of the former
// standalone SuppliersPage.
const SuppliersTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<"purchases" | "suppliers">("purchases");

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
  } = useSuppliersData();
  const { purchases, purchasesTotal, loadingPurchases, loadPurchases } = usePurchaseHistory();
  const {
    products,
    loadProducts,
    workers,
    loadWorkers,
    purchaseTrip,
    setPurchaseTrip,
    purchaseItems,
    recordingPurchase,
    purchaseError,
    purchaseSuccess,
    updateLineItem,
    addLineItem,
    removeLineItem,
    handleRecordPurchase,
    combinedTotal,
  } = usePurchaseForm(loadPurchases);

  useEffect(() => {
    loadSuppliers();
    loadProducts();
    loadWorkers();
    loadPurchases();
  }, []);

  return (
    <>
      <p className="text-gray-600 mb-6">
        Record what you actually buy, from whom, and at what cost — the foundation for margin tracking.
      </p>

      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setActiveSubTab("purchases")}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            activeSubTab === "purchases" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Record Purchase
        </button>
        <button
          onClick={() => setActiveSubTab("suppliers")}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            activeSubTab === "suppliers" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Suppliers ({suppliers.length})
        </button>
      </div>

      {activeSubTab === "purchases" ? (
        <>
          <RecordPurchaseForm
            suppliers={suppliers}
            products={products}
            workers={workers}
            purchaseTrip={purchaseTrip}
            setPurchaseTrip={setPurchaseTrip}
            purchaseItems={purchaseItems}
            updateLineItem={updateLineItem}
            addLineItem={addLineItem}
            removeLineItem={removeLineItem}
            purchaseError={purchaseError}
            purchaseSuccess={purchaseSuccess}
            recordingPurchase={recordingPurchase}
            combinedTotal={combinedTotal}
            onSubmit={handleRecordPurchase}
          />

          <PurchaseHistoryTable purchases={purchases} purchasesTotal={purchasesTotal} loadingPurchases={loadingPurchases} />
        </>
      ) : (
        <>
          <SupplierForm
            editingSupplierId={editingSupplierId}
            supplierForm={supplierForm}
            setSupplierForm={setSupplierForm}
            savingSupplier={savingSupplier}
            onSubmit={handleSaveSupplier}
            onCancel={resetSupplierForm}
          />

          <SuppliersTable
            suppliers={suppliers}
            loadingSuppliers={loadingSuppliers}
            onEdit={handleEditSupplier}
            onDeactivate={handleDeactivateSupplier}
          />
        </>
      )}
    </>
  );
};

export default SuppliersTab;
