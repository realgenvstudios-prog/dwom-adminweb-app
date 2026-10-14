import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, FlaskConical } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTabParam } from '@/hooks/use-tab-param';
import analyticsService, { type AnalyticsInsights, type OrderInsights } from '../services/analyticsService';
import notesService, { type NotesAnalytics } from '../services/notesService';
import { logger } from '../utils/logger';
import NotesTrackingTab from './analytics/NotesTrackingTab';
import OrdersInsightsTab from './analytics/OrdersInsightsTab';
import OverviewTab from './analytics/OverviewTab';
import { SAMPLE_NOTES, sampleInsights, sampleOrderInsights } from './analytics/sample-data';

const TAB_KEYS = ['orders', 'overview', 'notes'] as const;
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
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState({ insights: false, notes: false, orders: false });
  // null = automatic: sample data shows only while there's no real data.
  const [sampleChoice, setSampleChoice] = useState<boolean | null>(null);

  const load = useCallback(async (days: Range) => {
    setLoading(true);
    const to = new Date();
    const from = new Date(to.getTime() - days * 86400000);
    const eventFrom = new Date(to.getTime() - eventDays(days) * 86400000);
    const [i, n, o] = await Promise.allSettled([analyticsService.getInsights(eventFrom, to), notesService.getAnalytics(), analyticsService.getOrderInsights(from, to)]);
    if (i.status === 'rejected') logger.error('Failed to load analytics insights:', i.reason);
    if (n.status === 'rejected') logger.error('Failed to load notes analytics:', n.reason);
    if (o.status === 'rejected') logger.error('Failed to load order insights:', o.reason);
    setInsights(i.status === 'fulfilled' ? i.value : null);
    setNotes(n.status === 'fulfilled' ? n.value : null);
    setOrders(o.status === 'fulfilled' ? o.value : null);
    setFailed({ insights: i.status === 'rejected', notes: n.status === 'rejected', orders: o.status === 'rejected' });
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(range), 0);
    return () => clearTimeout(t);
  }, [load, range]);

  const hasReal =
    activeTab === 'orders' ? (orders?.totals.orders ?? 0) > 0 : activeTab === 'overview' ? (insights?.totals.events ?? 0) > 0 : (notes?.stats.totalNotes ?? 0) > 0;
  const sample = sampleChoice ?? (!loading && !hasReal);
  const sampleOverview = useMemo(() => sampleInsights(eventDays(range)), [range]);
  const sampleOrders = useMemo(() => sampleOrderInsights(range), [range]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">When and how customers order, and how they use the app.</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border px-3 py-1.5">
          <Switch id="sample" checked={sample} onCheckedChange={(v) => setSampleChoice(v)} />
          <Label htmlFor="sample" className="cursor-pointer text-sm font-normal">
            Sample data
          </Label>
        </div>
      </div>

      {sample && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900">
          <FlaskConical className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-medium">You’re looking at sample data — none of these numbers are real.</p>
            <p className="text-amber-900/80">
              {hasReal
                ? 'Real data is available — turn off “Sample data” to see it.'
                : (failed.insights && activeTab === 'overview') || (failed.orders && activeTab === 'orders')
                  ? 'The server doesn’t provide these insights yet (deploy the latest backend). Real numbers replace this automatically.'
                  : activeTab === 'orders'
                    ? 'No orders in this range yet. Real numbers replace this automatically.'
                    : 'No activity has been recorded yet. Real numbers replace this automatically once the app sends events.'}
            </p>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)} className="gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="overview">App usage</TabsTrigger>
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
          <OrdersInsightsTab data={sample ? sampleOrders : orders} loading={loading && !sample} failed={!sample && failed.orders} />
        </TabsContent>
        <TabsContent value="overview">
          <OverviewTab data={sample ? sampleOverview : insights} loading={loading && !sample} failed={!sample && failed.insights} />
        </TabsContent>
        <TabsContent value="notes">
          <NotesTrackingTab data={sample ? SAMPLE_NOTES : notes} loading={loading && !sample} failed={!sample && failed.notes} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
