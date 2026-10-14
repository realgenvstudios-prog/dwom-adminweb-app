import React, { useState } from "react";
import adminAuthService from "../services/authService";
import { resolveUiRole } from "../config/permissions";
import OverviewTab from "./finance/OverviewTab";
import ProductCostsTab from "./finance/ProductCostsTab";
import ExpensesTab from "./finance/ExpensesTab";
import FounderLedgerTab from "./finance/FounderLedgerTab";
import SettingsTab from "./finance/SettingsTab";

type TabKey = "overview" | "productCosts" | "expenses" | "founderLedger" | "settings";

const FinanceHubPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  const currentAdmin = adminAuthService.getCurrentAdmin();
  const role = resolveUiRole(currentAdmin);
  const isSuperAdmin = role === "Super Admin";

  const tabs: { key: TabKey; label: string }[] = [
    { key: "overview", label: "Overview & P&L" },
    { key: "productCosts", label: "Product Costs" },
    { key: "expenses", label: "Expenses" },
    ...(isSuperAdmin ? [{ key: "founderLedger" as TabKey, label: "Founder Ledger" }] : []),
    { key: "settings", label: "Settings" },
  ];

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4">
      <div className="max-w-(--breakpoint-2xl) mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Finance</h1>
          <p className="text-gray-600 mt-1">Revenue, real cost, profitability, and the config that drives all of it — in one place.</p>
        </div>

        <div className="mb-8 flex gap-2 border-b border-gray-200 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition ${
                activeTab === t.key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "productCosts" && <ProductCostsTab />}
        {activeTab === "expenses" && <ExpensesTab />}
        {activeTab === "founderLedger" && isSuperAdmin && <FounderLedgerTab />}
        {activeTab === "settings" && <SettingsTab />}
      </div>
    </div>
  );
};

export default FinanceHubPage;
