import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTabParam } from '@/hooks/use-tab-param';
import InventoryTab from './warehouse/InventoryTab';
import SuppliersTab from './warehouse/SuppliersTab';
import { allowedTabs, canTab } from '../config/permissions';
import { usePermissions } from '@/hooks/use-permissions';

const TABS = ['operations', 'suppliers'] as const;

const WarehouseOperationsPage: React.FC = () => {
  usePermissions();
  const allowed = allowedTabs('/warehouse', TABS);
  const [activeTab, setActiveTab] = useTabParam(allowed, allowed[0] ?? 'operations');

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Warehouse</h1>
        <p className="text-sm text-muted-foreground">Stock you hold, and the suppliers you buy from.</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as (typeof TABS)[number])} className="gap-6">
        <TabsList>
          {canTab('/warehouse', 'operations') && <TabsTrigger value="operations">Inventory</TabsTrigger>}
          {canTab('/warehouse', 'suppliers') && <TabsTrigger value="suppliers">Suppliers</TabsTrigger>}
        </TabsList>
        {canTab('/warehouse', 'operations') && (
          <TabsContent value="operations">
            <InventoryTab />
          </TabsContent>
        )}
        {canTab('/warehouse', 'suppliers') && (
          <TabsContent value="suppliers">
            <SuppliersTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default WarehouseOperationsPage;
