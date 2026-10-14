import React, { useState, useEffect } from "react";
import seasonalService from "../../services/seasonalService";
import type { Product } from "./ProductTypes";
import { logger } from "../../utils/logger";

interface SeasonalRotationPanelProps {
  seasonalProducts: Product[];
}

interface SeasonalConfig {
  rotationFrequency: "daily" | "weekly" | "monthly";
  featuredProductId: number;
}

// The only genuinely global part of "seasonal products" — which product is
// currently featured and how often it rotates. Per-product seasonal
// status is now just a toggle on the Products table itself.
const SeasonalRotationPanel: React.FC<SeasonalRotationPanelProps> = ({ seasonalProducts }) => {
  const [config, setConfig] = useState<SeasonalConfig>({ rotationFrequency: "daily", featuredProductId: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    seasonalService.getSeasonalConfig().then((c) => c && setConfig(c)).catch((err) => logger.error("Failed to load seasonal config:", err));
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      await seasonalService.updateSeasonalConfig(config);
    } catch (err) {
      logger.error("Failed to save seasonal config:", err);
      setError("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow border border-gray-100 p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Seasonal Rotation</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Rotation Frequency</label>
          <select
            value={config.rotationFrequency}
            onChange={(e) => setConfig({ ...config, rotationFrequency: e.target.value as SeasonalConfig["rotationFrequency"] })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 outline-none"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Featured Product</label>
          <select
            value={config.featuredProductId}
            onChange={(e) => setConfig({ ...config, featuredProductId: parseInt(e.target.value, 10) })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 outline-none"
          >
            <option value={0}>Auto-rotate (Random)</option>
            {seasonalProducts.map((p) => (
              <option key={p.id} value={p.id}>{p.nameEnglish}</option>
            ))}
          </select>
        </div>
      </div>
      {error && <p className="text-red-600 text-sm mb-3">⚠️ {error}</p>}
      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium text-sm"
      >
        {saving ? "Saving..." : "Save Configuration"}
      </button>
    </div>
  );
};

export default SeasonalRotationPanel;
