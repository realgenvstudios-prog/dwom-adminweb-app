import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTabParam } from '@/hooks/use-tab-param';
import RidersTab from './riders/RidersTab';
import ApplicationsTab from './riders/applications/ApplicationsTab';
import PickersTab from './workers/PickersTab';
import ZonesTab from './workforce/ZonesTab';
import PickupPointsTab from './riders/pickup/PickupPointsTab';
import { allowedTabs, canTab } from '../config/permissions';
import { usePermissions } from '@/hooks/use-permissions';

const TABS = ['riders', 'applications', 'pickers', 'zones', 'pickup'] as const;

// Everyone and everything working outside the building: riders deliver,
// pickers buy from suppliers, zones define where (and for how much) DWOM
// delivers. Navigation only — Rider, Worker, and Zone stay separate models.
const FieldOperationsPage: React.FC = () => {
  usePermissions();
  const allowed = allowedTabs('/field-operations', TABS);
  const [activeTab, setActiveTab] = useTabParam(allowed, allowed[0] ?? 'riders');

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Field Operations</h1>
        <p className="text-sm text-muted-foreground">Riders, pickers, and the zones DWOM delivers to.</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as (typeof TABS)[number])} className="gap-6">
        <TabsList>
          {canTab('/field-operations', 'riders') && <TabsTrigger value="riders">Riders</TabsTrigger>}
          {canTab('/field-operations', 'applications') && <TabsTrigger value="applications">Applications</TabsTrigger>}
          {canTab('/field-operations', 'pickers') && <TabsTrigger value="pickers">Pickers</TabsTrigger>}
          {canTab('/field-operations', 'zones') && <TabsTrigger value="zones">Delivery Zones</TabsTrigger>}
          {canTab('/field-operations', 'pickup') && <TabsTrigger value="pickup">Pickup points</TabsTrigger>}
        </TabsList>
        {canTab('/field-operations', 'riders') && (
          <TabsContent value="riders">
            <RidersTab />
          </TabsContent>
        )}
        {canTab('/field-operations', 'applications') && (
          <TabsContent value="applications">
            <ApplicationsTab />
          </TabsContent>
        )}
        {canTab('/field-operations', 'pickers') && (
          <TabsContent value="pickers">
            <PickersTab />
          </TabsContent>
        )}
        {canTab('/field-operations', 'zones') && (
          <TabsContent value="zones">
            <ZonesTab />
          </TabsContent>
        )}
        {canTab('/field-operations', 'pickup') && (
          <TabsContent value="pickup">
            <PickupPointsTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default FieldOperationsPage;
