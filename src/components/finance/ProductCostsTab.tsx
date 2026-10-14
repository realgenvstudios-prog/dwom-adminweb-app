import React, { useState, useEffect, useCallback } from "react";
import productsService, { type Product, type Category } from "../../services/productsService";
import { logger } from "../../utils/logger";

const ProductCostsTab: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [productsData, categoriesData] = await Promise.all([
        productsService.getAll(),
        productsService.getCategories(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
      const nextDrafts: Record<number, string> = {};
      for (const p of productsData) nextDrafts[p.id] = p.standardCost != null ? String(p.standardCost) : "";
      setDrafts(nextDrafts);
    } catch (err) {
      logger.error("Failed to load products for cost entry:", err);
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const categoryName = (p: Product): string => {
    const prod = p as any;
    const catId = p.categoryId || prod.Category?.id;
    return categories.find((c) => c.id === catId)?.name || prod.Category?.name || "—";
  };

  const handleSave = async (productId: number) => {
    const raw = drafts[productId];
    const standardCost = raw === "" ? undefined : parseFloat(raw);
    if (raw !== "" && (standardCost === undefined || isNaN(standardCost) || standardCost < 0)) {
      setError("Enter a valid cost");
      return;
    }
    try {
      setSavingId(productId);
      setError(null);
      const updated = await productsService.update(productId, { standardCost });
      setProducts((prev) => prev.map((p) => (p.id === productId ? updated : p)));
    } catch (err) {
      logger.error("Failed to save product cost:", err);
      setError("Failed to save cost");
    } finally {
      setSavingId(null);
    }
  };

  const filtered = products.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return p.nameEnglish.toLowerCase().includes(q) || p.nameLocal?.toLowerCase().includes(q);
  });

  const withoutCost = products.filter((p) => p.standardCost == null).length;

  return (
    <>
      <p className="text-gray-600 mb-6">
        Internal purchase cost per product — what you currently pay, not what you sell for. Drives margin calculations across the
        rest of this hub without needing to log every purchase. {withoutCost > 0 && (
          <span className="text-amber-700 font-medium">{withoutCost} product{withoutCost === 1 ? "" : "s"} still need a cost set.</span>
        )}
      </p>

      <div className="bg-white shadow-xs rounded-xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Products ({filtered.length})</h2>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-64"
          />
        </div>

        {error && <p className="text-red-600 text-sm mb-3">⚠️ {error}</p>}

        {loading ? (
          <p className="text-gray-500 text-sm py-8 text-center">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-500 text-sm py-8 text-center">No products found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="py-2 pr-4">Product</th>
                  <th className="py-2 pr-4">Category</th>
                  <th className="py-2 pr-4">Sell price</th>
                  <th className="py-2 pr-4">Purchase cost</th>
                  <th className="py-2 pr-4">Margin</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const draft = drafts[p.id] ?? "";
                  const cost = draft === "" ? null : parseFloat(draft);
                  const margin = cost != null && !isNaN(cost) ? p.pricePerUnit - cost : null;
                  const marginPct = margin != null && p.pricePerUnit > 0 ? (margin / p.pricePerUnit) * 100 : null;
                  return (
                    <tr key={p.id} className="border-b border-gray-50">
                      <td className="py-2 pr-4 font-medium">{p.nameEnglish}</td>
                      <td className="py-2 pr-4 text-gray-500">{categoryName(p)}</td>
                      <td className="py-2 pr-4">GHS {p.pricePerUnit.toLocaleString()}</td>
                      <td className="py-2 pr-4">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={draft}
                          onChange={(e) => setDrafts({ ...drafts, [p.id]: e.target.value })}
                          onBlur={() => handleSave(p.id)}
                          placeholder="not set"
                          className="w-28 border border-gray-200 rounded-lg px-2 py-1"
                        />
                      </td>
                      <td className="py-2 pr-4">
                        {margin != null && !isNaN(margin) ? (
                          <span className={margin >= 0 ? "text-green-700" : "text-red-700"}>
                            GHS {margin.toFixed(2)} ({marginPct!.toFixed(0)}%)
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-2 text-right text-xs text-gray-400">
                        {savingId === p.id ? "Saving..." : ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default ProductCostsTab;
