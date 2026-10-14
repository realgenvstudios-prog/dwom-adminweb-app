import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTabParam } from '@/hooks/use-tab-param';
import RidersTab from './riders/RidersTab';
import PickersTab from './workers/PickersTab';
import ZonesTab from './workforce/ZonesTab';

const TABS = ['riders', 'pickers', 'zones'] as const;

// Everyone and everything working outside the building: riders deliver,
// pickers buy from suppliers, zones define where (and for how much) DWOM
// delivers. Navigation only — Rider, Worker, and Zone stay separate models.
const FieldOperationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useTabParam(TABS, 'riders');

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Field Operations</h1>
        <p className="text-sm text-muted-foreground">Riders, pickers, and the zones DWOM delivers to.</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as (typeof TABS)[number])} className="gap-6">
        <TabsList>
          <TabsTrigger value="riders">Riders</TabsTrigger>
          <TabsTrigger value="pickers">Pickers</TabsTrigger>
          <TabsTrigger value="zones">Delivery Zones</TabsTrigger>
        </TabsList>
        <TabsContent value="riders">
          <RidersTab />
        </TabsContent>
        <TabsContent value="pickers">
          <PickersTab />
        </TabsContent>
        <TabsContent value="zones">
          <ZonesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FieldOperationsPage;
