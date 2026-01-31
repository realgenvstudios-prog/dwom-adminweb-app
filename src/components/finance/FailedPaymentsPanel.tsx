import React, { useState, useEffect } from "react";
import financeService, { type FailedPayment } from "../../services/financeService";

const REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes

const FailedPaymentsPanel: React.FC = () => {
  const [failedPayments, setFailedPayments] = useState<FailedPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFailedPayments();

    // Set up auto-refresh
    const interval = setInterval(() => {
      fetchFailedPayments();
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  const fetchFailedPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const payments = await financeService.getFailedPayments(5);
      setFailedPayments(payments);
    } catch (error: any) {
      console.error("Failed to fetch failed payments:", error);
      setError(error?.message || "Failed to load payments");
      setFailedPayments([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 mb-8">
      <h3 className="text-lg font-semibold mb-4">Failed Payments</h3>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
          ⚠️ {error}
        </div>
      )}
      {loading && !failedPayments.length ? (
        <div className="flex items-center justify-center py-8">
          <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : (
        <table className="min-w-full text-left text-sm mb-2">
          <thead>
            <tr className="text-gray-500 border-b">
              <th className="py-2 pr-4 font-medium">Date</th>
              <th className="py-2 pr-4 font-medium">Customer</th>
              <th className="py-2 pr-4 font-medium">Amount</th>
              <th className="py-2 pr-4 font-medium">Method</th>
              <th className="py-2 pr-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {failedPayments.length > 0 ? (
              failedPayments.map((p, idx) => (
                <tr key={idx} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-2 pr-4">{p.date}</td>
                  <td className="py-2 pr-4">{p.customer}</td>
                  <td className="py-2 pr-4">GHS {p.amount.toFixed(2)}</td>
                  <td className="py-2 pr-4">{p.method}</td>
                  <td className="py-2 pr-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${p.status === 'failed' ? 'bg-red-100 text-red-700' : p.status === 'retried' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-4 text-center text-gray-500">
                  No failed payments
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default FailedPaymentsPanel;
