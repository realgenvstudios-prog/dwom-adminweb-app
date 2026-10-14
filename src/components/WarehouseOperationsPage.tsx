import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTabParam } from '@/hooks/use-tab-param';
import InventoryTab from './warehouse/InventoryTab';
import SuppliersTab from './warehouse/SuppliersTab';

const TABS = ['operations', 'suppliers'] as const;

const WarehouseOperationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useTabParam(TABS, 'operations');

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Warehouse</h1>
        <p className="text-sm text-muted-foreground">Stock you hold, and the suppliers you buy from.</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as (typeof TABS)[number])} className="gap-6">
        <TabsList>
          <TabsTrigger value="operations">Inventory</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
        </TabsList>
        <TabsContent value="operations">
          <InventoryTab />
        </TabsContent>
        <TabsContent value="suppliers">
          <SuppliersTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WarehouseOperationsPage;
