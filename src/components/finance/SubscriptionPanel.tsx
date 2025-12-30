import React from "react";
import { subscriptionsTrend } from "./financeMockData";

const projectedMRR = Math.round(
  subscriptionsTrend[subscriptionsTrend.length - 1].active * 85 // mock average sub value
);

const SubscriptionPanel: React.FC = () => (
  <div className="bg-white rounded-xl shadow p-6 mb-8">
    <h3 className="text-lg font-semibold mb-4">Subscriptions & Predictability</h3>
    <div className="mb-2 text-sm">Active Subs Over Time:</div>
    <div className="flex gap-4 mb-2">
      {subscriptionsTrend.map((d) => (
        <div key={d.date} className="flex flex-col items-center">
          <span className="font-bold">{d.active}</span>
          <span className="text-xs text-gray-500">{d.date}</span>
        </div>
      ))}
    </div>
    <div className="mb-2 text-sm">Churned Subs:</div>
    <div className="flex gap-4 mb-2">
      {subscriptionsTrend.map((d) => (
        <div key={d.date} className="flex flex-col items-center">
          <span className="font-bold text-red-500">{d.churned}</span>
          <span className="text-xs text-gray-500">{d.date}</span>
        </div>
      ))}
    </div>
    <div className="mt-4 text-sm">Projected MRR next 30 days: <span className="font-bold">GHS {projectedMRR.toLocaleString()}</span></div>
  </div>
);

export default SubscriptionPanel;
