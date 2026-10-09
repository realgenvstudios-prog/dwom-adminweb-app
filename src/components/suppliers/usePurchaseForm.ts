import { useState, type FormEvent } from "react";
import procurementService from "../../services/procurementService";
import productsService from "../../services/productsService";

// A purchase is one trip to one supplier that can cover several products —
// the trip-level fields (supplier, who bought it, trip notes) are shared,
// while each product gets its own line item.
export type PurchaseLineItem = { productId: string; quantity: string; unitCost: string };
const emptyLineItem: PurchaseLineItem = { productId: "", quantity: "", unitCost: "" };
const emptyPurchaseTrip = { supplierId: "", purchasedBy: "", notes: "" };

// The "Record a Purchase" form: product picker data, trip + line-item
// state, and submission. Split out of the former monolithic
// SuppliersPage. Takes loadPurchases from usePurchaseHistory since a
// successful record needs to refresh that table.
export function usePurchaseForm(loadPurchases: () => Promise<void>) {
  const [products, setProducts] = useState<any[]>([]);
  const [purchaseTrip, setPurchaseTrip] = useState(emptyPurchaseTrip);
  const [purchaseItems, setPurchaseItems] = useState<PurchaseLineItem[]>([{ ...emptyLineItem }]);
  const [recordingPurchase, setRecordingPurchase] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);

  const loadProducts = async () => {
    try {
      const data = await productsService.getAll();
      setProducts(Array.isArray(data) ? data : data?.items || []);
    } catch (err) {
      console.error("❌ [SuppliersPage] Failed to load products:", err);
    }
  };

  const updateLineItem = (index: number, field: keyof PurchaseLineItem, value: string) => {
    setPurchaseItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const addLineItem = () => setPurchaseItems((prev) => [...prev, { ...emptyLineItem }]);

  const removeLineItem = (index: number) =>
    setPurchaseItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));

  const handleRecordPurchase = async (e: FormEvent) => {
    e.preventDefault();
    setPurchaseError(null);
    setPurchaseSuccess(null);

    const supplierId = parseInt(purchaseTrip.supplierId, 10);
    if (!supplierId) {
      setPurchaseError("Please select a supplier.");
      return;
    }

    const parsedItems: { productId: number; quantity: number; unitCost: number }[] = [];
    for (const item of purchaseItems) {
      const productId = parseInt(item.productId, 10);
      const quantity = parseFloat(item.quantity);
      const unitCost = parseFloat(item.unitCost);
      if (!productId || !quantity || quantity <= 0 || isNaN(unitCost) || unitCost < 0) {
        setPurchaseError("Every product row needs a product selected, a positive quantity, and a valid cost.");
        return;
      }
      parsedItems.push({ productId, quantity, unitCost });
    }

    try {
      setRecordingPurchase(true);
      await procurementService.recordBatchPurchase({
        supplierId,
        items: parsedItems,
        purchasedBy: purchaseTrip.purchasedBy || undefined,
        notes: purchaseTrip.notes || undefined,
      });
      setPurchaseSuccess(
        `Purchase recorded — ${parsedItems.length} product${parsedItems.length > 1 ? "s" : ""}, inventory updated.`,
      );
      setPurchaseTrip(emptyPurchaseTrip);
      setPurchaseItems([{ ...emptyLineItem }]);
      await loadPurchases();
    } catch (err: any) {
      setPurchaseError(err.message || "Failed to record purchase");
    } finally {
      setRecordingPurchase(false);
    }
  };

  const combinedTotal = purchaseItems.reduce((sum, item) => {
    const q = parseFloat(item.quantity) || 0;
    const c = parseFloat(item.unitCost) || 0;
    return sum + q * c;
  }, 0);

  return {
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
  };
}
