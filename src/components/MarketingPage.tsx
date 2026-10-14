import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTabParam } from '@/hooks/use-tab-param';
import CampaignsTab from './marketing/CampaignsTab';
import CouponsTab from './marketing/CouponsTab';
import NotificationsTab from './marketing/NotificationsTab';

const TAB_KEYS = ['campaigns', 'notifications', 'coupons'] as const;
type TabKey = (typeof TAB_KEYS)[number];

const TABS: { key: TabKey; label: string }[] = [
  { key: 'campaigns', label: 'Campaigns' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'coupons', label: 'Discount Codes' },
];

const MarketingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useTabParam(TAB_KEYS, 'campaigns');

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Marketing</h1>
        <p className="text-sm text-muted-foreground">Reach customers, and see which campaigns and codes actually bring in orders.</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)} className="gap-6">
        <div className="overflow-x-auto">
          <TabsList>
            {TABS.map((t) => (
              <TabsTrigger key={t.key} value={t.key}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <TabsContent value="campaigns">
          <CampaignsTab />
        </TabsContent>
        <TabsContent value="notifications">
          <NotificationsTab />
        </TabsContent>
        <TabsContent value="coupons">
          <CouponsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketingPage;
