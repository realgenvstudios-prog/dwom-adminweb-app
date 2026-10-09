import { useState } from "react";
import procurementService from "../../services/procurementService";
import type { ProcurementRecord } from "../../services/procurementService";

// Recent purchase-history table data. Split out of the former monolithic
// SuppliersPage.
export function usePurchaseHistory() {
  const [purchases, setPurchases] = useState<ProcurementRecord[]>([]);
  const [purchasesTotal, setPurchasesTotal] = useState(0);
  const [loadingPurchases, setLoadingPurchases] = useState(true);

  const loadPurchases = async () => {
    try {
      setLoadingPurchases(true);
      const data = await procurementService.getAll({ take: 50 });
      setPurchases(data.items);
      setPurchasesTotal(data.total);
    } catch (err) {
      console.error("❌ [SuppliersPage] Failed to load purchase history:", err);
    } finally {
      setLoadingPurchases(false);
    }
  };

  return { purchases, purchasesTotal, loadingPurchases, loadPurchases };
}
