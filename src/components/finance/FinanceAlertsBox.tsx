import React, { useState, useEffect } from "react";
import financeService, { type FinanceKPIs } from "../../services/financeService";

const FinanceAlertsBox: React.FC = () => {
  const [alerts, setAlerts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    generateAlerts();
    // Refresh alerts every 30 minutes
    const interval = setInterval(() => {
      generateAlerts();
    }, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const generateAlerts = async () => {
    try {
      setLoading(true);
      const kpis = await financeService.getFinanceKPIs();
      
      const generatedAlerts: string[] = [];

      // Generate alerts based on KPI data
      if (kpis.failedPaymentRate > 0.05) {
        generatedAlerts.push(`⚠️ High failed payment rate: ${(kpis.failedPaymentRate * 100).toFixed(2)}%`);
      }

      if (kpis.activeSubscriptions === 0) {
        generatedAlerts.push("📋 No active subscriptions found");
      } else if (kpis.activeSubscriptions < 10) {
        generatedAlerts.push(`📋 Low subscription count: ${kpis.activeSubscriptions} active`);
      }

      if (kpis.avgOrderValue === 0 || kpis.gmv === 0) {
        generatedAlerts.push("📊 No order data available");
      }

      if (kpis.netRevenue < 1000) {
        generatedAlerts.push(`💰 Low net revenue: GHS ${kpis.netRevenue.toFixed(2)}`);
      }

      // If no alerts, show positive message
      if (generatedAlerts.length === 0) {
        generatedAlerts.push("✅ All systems operating normally");
      }

      setAlerts(generatedAlerts);
    } catch (error) {
      console.error("Failed to generate alerts:", error);
      setAlerts(["⚠️ Unable to generate alerts at this time"]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 mb-8">
      <h3 className="text-lg font-semibold mb-4">Alerts</h3>
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : (
        <ul className="space-y-2 text-sm">
          {alerts.map((alert, idx) => (
            <li key={idx} className="bg-yellow-50 text-yellow-800 px-3 py-2 rounded-lg shadow-sm">
              {alert}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FinanceAlertsBox;
