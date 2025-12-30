import React from "react";
import { financeAlerts } from "./financeMockData";

const FinanceAlertsBox: React.FC = () => (
  <div className="bg-white rounded-xl shadow p-6 mb-8">
    <h3 className="text-lg font-semibold mb-4">Alerts</h3>
    <ul className="space-y-2 text-sm">
      {financeAlerts.map((alert, idx) => (
        <li key={idx} className="bg-yellow-50 text-yellow-800 px-3 py-2 rounded-lg shadow-sm">{alert}</li>
      ))}
    </ul>
  </div>
);

export default FinanceAlertsBox;
