import React, { useState, useEffect } from "react";
import financeService from "../../services/financeService";

const REFRESH_INTERVAL = 20 * 60 * 1000; // 20 minutes

const SubscriptionPanel: React.FC = () => {
  const [activeSubscriptions, setActiveSubscriptions] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscriptions();

    // Set up auto-refresh
    const interval = setInterval(() => {
      fetchSubscriptions();
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      setError(null);
      const count = await financeService.getActiveSubscriptions();
      setActiveSubscriptions(count);
    } catch (error: any) {
      console.error("Failed to fetch subscriptions:", error);
      setError(error?.message || "Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  };

  const projectedMRR = Math.round(activeSubscriptions * 25); // GHS 25/month

  return (
    <div className="bg-white rounded-xl shadow p-6 mb-8">
      <h3 className="text-lg font-semibold mb-4">Subscriptions & Predictability</h3>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
          ⚠️ {error}
        </div>
      )}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <div className="text-sm text-gray-600">Active Subscriptions</div>
            <div className="text-3xl font-bold text-green-600">{activeSubscriptions}</div>
          </div>
          <div className="mt-4 text-sm">
            Projected MRR: <span className="font-bold text-lg">GHS {projectedMRR.toLocaleString()}</span>
          </div>
        </>
      )}
    </div>
  );
};

export default SubscriptionPanel;
