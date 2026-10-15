import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTabParam } from '@/hooks/use-tab-param';
import { allowedTabs } from '../config/permissions';
import { usePermissions } from '@/hooks/use-permissions';
import OverviewTab from './finance/OverviewTab';
import ProductCostsTab from './finance/ProductCostsTab';
import ExpensesTab from './finance/ExpensesTab';
import FounderLedgerTab from './finance/FounderLedgerTab';
import SettingsTab from './finance/SettingsTab';

const TAB_KEYS = ['overview', 'productCosts', 'expenses', 'founderLedger', 'settings'] as const;
type TabKey = (typeof TAB_KEYS)[number];

const FinanceHubPage: React.FC = () => {
  usePermissions();
  const allowed = allowedTabs('/finance', TAB_KEYS);
  const [activeTab, setActiveTab] = useTabParam(allowed, allowed[0] ?? 'overview');

  const tabs = (
    [
      { key: 'overview', label: 'Overview & P&L' },
      { key: 'productCosts', label: 'Product Costs' },
      { key: 'expenses', label: 'Expenses' },
      { key: 'founderLedger', label: 'Founder Ledger' },
      { key: 'settings', label: 'Settings' },
    ] as { key: TabKey; label: string }[]
  ).filter((t) => allowed.includes(t.key));

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
        {allowed.includes('overview') && (
          <TabsContent value="overview">
            <OverviewTab />
          </TabsContent>
        )}
        {allowed.includes('productCosts') && (
          <TabsContent value="productCosts">
            <ProductCostsTab />
          </TabsContent>
        )}
        {allowed.includes('expenses') && (
          <TabsContent value="expenses">
            <ExpensesTab />
          </TabsContent>
        )}
        {allowed.includes('founderLedger') && (
          <TabsContent value="founderLedger">
            <FounderLedgerTab />
          </TabsContent>
        )}
        {allowed.includes('settings') && (
          <TabsContent value="settings">
            <SettingsTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default FinanceHubPage;
