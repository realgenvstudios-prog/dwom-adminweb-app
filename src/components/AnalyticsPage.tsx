import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, Info } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTabParam } from '@/hooks/use-tab-param';
import analyticsService, { type AnalyticsInsights, type OrderInsights, type SignupInsights } from '../services/analyticsService';
import notesService, { type NotesAnalytics } from '../services/notesService';
import { logger } from '../utils/logger';
import NotesTrackingTab from './analytics/NotesTrackingTab';
import OrdersInsightsTab from './analytics/OrdersInsightsTab';
import OverviewTab from './analytics/OverviewTab';
import SignupsTab from './analytics/SignupsTab';

const TAB_KEYS = ['orders', 'overview', 'signups', 'notes'] as const;
type TabKey = (typeof TAB_KEYS)[number];
const RANGES = [7, 30, 90, 365] as const;
type Range = (typeof RANGES)[number];
const rangeLabel = (r: Range) => (r === 365 ? 'Last 12 months' : `Last ${r} days`);
// App-event insights are capped at 92 days server-side.
const eventDays = (r: Range) => Math.min(r, 90);

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useTabParam(TAB_KEYS, 'orders');
  const [range, setRange] = useState<Range>(30);
  const [insights, setInsights] = useState<AnalyticsInsights | null>(null);
  const [orders, setOrders] = useState<OrderInsights | null>(null);
  const [notes, setNotes] = useState<NotesAnalytics | null>(null);
  const [signups, setSignups] = useState<SignupInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState({ insights: false, notes: false, orders: false, signups: false });

  const load = useCallback(async (days: Range) => {
    setLoading(true);
    const to = new Date();
    const from = new Date(to.getTime() - days * 86400000);
    const eventFrom = new Date(to.getTime() - eventDays(days) * 86400000);
    const [i, n, o, s] = await Promise.allSettled([
      analyticsService.getInsights(eventFrom, to),
      notesService.getAnalytics(),
      analyticsService.getOrderInsights(from, to),
      analyticsService.getSignups(eventFrom, to),
    ]);
    if (i.status === 'rejected') logger.error('Failed to load analytics insights:', i.reason);
    if (s.status === 'rejected') logger.error('Failed to load sign-up insights:', s.reason);
    if (n.status === 'rejected') logger.error('Failed to load notes analytics:', n.reason);
    if (o.status === 'rejected') logger.error('Failed to load order insights:', o.reason);
    setInsights(i.status === 'fulfilled' ? i.value : null);
    setNotes(n.status === 'fulfilled' ? n.value : null);
    setOrders(o.status === 'fulfilled' ? o.value : null);
    setSignups(s.status === 'fulfilled' ? s.value : null);
    setFailed({ insights: i.status === 'rejected', notes: n.status === 'rejected', orders: o.status === 'rejected', signups: s.status === 'rejected' });
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(range), 0);
    return () => clearTimeout(t);
  }, [load, range]);

  // App usage only fills in once the app sends activity events.
  const noAppActivity = activeTab === 'overview' && !loading && !failed.insights && (insights?.totals.events ?? 0) === 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">When and how customers order, how they use the app, and how guests become customers.</p>
      </div>

      {noAppActivity && (
        <div className="flex items-start gap-3 rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" />
          <p>No app activity recorded in this range yet. These figures fill in as customers use the latest version of the app.</p>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)} className="gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="overview">App usage</TabsTrigger>
            <TabsTrigger value="signups">Sign-ups</TabsTrigger>
            <TabsTrigger value="notes">Shopping notes</TabsTrigger>
          </TabsList>
          {activeTab !== 'notes' && (
            <Select value={String(activeTab === 'orders' ? range : eventDays(range))} onValueChange={(v) => setRange(Number(v) as Range)}>
              <SelectTrigger size="sm" className="h-8 w-auto gap-2">
                <CalendarDays className="size-4 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RANGES.filter((r) => activeTab === 'orders' || r !== 365).map((r) => (
                  <SelectItem key={r} value={String(r)}>
                    {rangeLabel(r)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <TabsContent value="orders">
          <OrdersInsightsTab data={orders} loading={loading} failed={failed.orders} />
        </TabsContent>
        <TabsContent value="overview">
          <OverviewTab data={insights} loading={loading} failed={failed.insights} />
        </TabsContent>
        <TabsContent value="signups">
          <SignupsTab data={signups} loading={loading} failed={failed.signups} />
        </TabsContent>
        <TabsContent value="notes">
          <NotesTrackingTab data={notes} loading={loading} failed={failed.notes} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
