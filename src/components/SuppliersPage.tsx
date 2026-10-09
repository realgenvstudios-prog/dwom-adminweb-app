import React, { useState, useEffect } from "react";
import { useSuppliersData } from "./suppliers/useSuppliersData";
import { usePurchaseForm } from "./suppliers/usePurchaseForm";
import { usePurchaseHistory } from "./suppliers/usePurchaseHistory";
import RecordPurchaseForm from "./suppliers/RecordPurchaseForm";
import PurchaseHistoryTable from "./suppliers/PurchaseHistoryTable";
import SupplierForm from "./suppliers/SupplierForm";
import SuppliersTable from "./suppliers/SuppliersTable";

const SuppliersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"purchases" | "suppliers">("purchases");

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
    loadPurchases();
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Suppliers & Purchases</h1>
          <p className="text-gray-600 mt-1">
            Record what you actually buy, from whom, and at what cost — the foundation for margin tracking.
          </p>
        </div>

        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setActiveTab("purchases")}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              activeTab === "purchases" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Record Purchase
          </button>
          <button
            onClick={() => setActiveTab("suppliers")}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              activeTab === "suppliers" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Suppliers ({suppliers.length})
          </button>
        </div>

        {activeTab === "purchases" ? (
          <>
            <RecordPurchaseForm
              suppliers={suppliers}
              products={products}
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
      </div>
    </div>
  );
};

export default SuppliersPage;
