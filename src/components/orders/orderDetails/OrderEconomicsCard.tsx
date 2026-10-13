import { useState, useEffect } from "react";
import adminApiClient from "../../../services/apiClient";
import { logger } from "../../../utils/logger";

interface OrderCostBreakdown {
  productCost: number;
  kayayieCost: number;
  riderCost: number;
  packagingCost: number;
  paymentFeeEstimate: number;
  totalCost: number;
  contribution: number;
}

interface OrderEconomicsCardProps {
  orderId: number | null;
}

// Per-order real-cost breakdown from CostCalculationService — productCost
// comes from Procurement/SupplierPriceRecord, kayayie/rider cost are 0 until
// Phase 2's Worker/Trip tracking ships (deliberately zero, not estimated).
export default function OrderEconomicsCard({ orderId }: OrderEconomicsCardProps) {
  const [breakdown, setBreakdown] = useState<OrderCostBreakdown | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await adminApiClient.get<OrderCostBreakdown>(`/admin/finance/orders/${orderId}/cost-breakdown`);
        if (!cancelled) setBreakdown(data);
      } catch (err) {
        logger.error("Failed to fetch order cost breakdown:", err);
        if (!cancelled) setError("Could not load cost breakdown");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (loading) {
    return (
      <div>
        <div className="text-sm font-bold text-gray-900 mb-3">📊 ECONOMICS</div>
        <div className="text-xs text-gray-400">Loading cost breakdown...</div>
      </div>
    );
  }

  if (error || !breakdown) {
    return (
      <div>
        <div className="text-sm font-bold text-gray-900 mb-3">📊 ECONOMICS</div>
        <div className="text-xs text-gray-400">{error || "No cost data available"}</div>
      </div>
    );
  }

  const rows: { label: string; value: number; note?: string }[] = [
    { label: "Product cost", value: breakdown.productCost },
    { label: "Kayayie / picker cost", value: breakdown.kayayieCost, note: breakdown.kayayieCost === 0 ? "not tracked yet" : undefined },
    { label: "Rider cost", value: breakdown.riderCost, note: breakdown.riderCost === 0 ? "not tracked yet" : undefined },
    { label: "Packaging", value: breakdown.packagingCost },
    { label: "Payment fee (est.)", value: breakdown.paymentFeeEstimate },
  ];

  return (
    <div>
      <div className="text-sm font-bold text-gray-900 mb-3">📊 ECONOMICS</div>
      <div className="bg-gray-50 rounded-lg border border-gray-200 divide-y divide-gray-200">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between items-center px-4 py-2 text-sm">
            <span className="text-gray-600">
              {r.label}
              {r.note && <span className="text-gray-400 text-xs ml-1">({r.note})</span>}
            </span>
            <span className="font-medium text-gray-900">GHS {r.value.toFixed(2)}</span>
          </div>
        ))}
        <div className="flex justify-between items-center px-4 py-2 text-sm bg-gray-100">
          <span className="text-gray-700 font-semibold">Total cost</span>
          <span className="font-bold text-gray-900">GHS {breakdown.totalCost.toFixed(2)}</span>
        </div>
        <div
          className={`flex justify-between items-center px-4 py-2 text-sm ${
            breakdown.contribution >= 0 ? "bg-green-50" : "bg-red-50"
          }`}
        >
          <span className={`font-semibold ${breakdown.contribution >= 0 ? "text-green-700" : "text-red-700"}`}>
            Contribution
          </span>
          <span className={`font-bold ${breakdown.contribution >= 0 ? "text-green-700" : "text-red-700"}`}>
            GHS {breakdown.contribution.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
