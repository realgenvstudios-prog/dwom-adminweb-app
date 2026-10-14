import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTabParam } from '@/hooks/use-tab-param';
import adminAuthService from '../services/authService';
import { resolveUiRole } from '../config/permissions';
import OverviewTab from './finance/OverviewTab';
import ProductCostsTab from './finance/ProductCostsTab';
import ExpensesTab from './finance/ExpensesTab';
import FounderLedgerTab from './finance/FounderLedgerTab';
import SettingsTab from './finance/SettingsTab';

const TAB_KEYS = ['overview', 'productCosts', 'expenses', 'founderLedger', 'settings'] as const;
type TabKey = (typeof TAB_KEYS)[number];

const FinanceHubPage: React.FC = () => {
  const [activeTab, setActiveTab] = useTabParam(TAB_KEYS, 'overview');
  const isSuperAdmin = resolveUiRole(adminAuthService.getCurrentAdmin()) === 'Super Admin';

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'overview', label: 'Overview & P&L' },
    { key: 'productCosts', label: 'Product Costs' },
    { key: 'expenses', label: 'Expenses' },
    ...(isSuperAdmin ? [{ key: 'founderLedger' as TabKey, label: 'Founder Ledger' }] : []),
    { key: 'settings', label: 'Settings' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Finance</h1>
        <p className="text-sm text-muted-foreground">Revenue, real costs and profitability, plus the settings behind them.</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)} className="gap-6">
        <div className="overflow-x-auto">
          <TabsList>
            {tabs.map((t) => (
              <TabsTrigger key={t.key} value={t.key}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>
        <TabsContent value="productCosts">
          <ProductCostsTab />
        </TabsContent>
        <TabsContent value="expenses">
          <ExpensesTab />
        </TabsContent>
        {isSuperAdmin && (
          <TabsContent value="founderLedger">
            <FounderLedgerTab />
          </TabsContent>
        )}
        <TabsContent value="settings">
          <SettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinanceHubPage;
