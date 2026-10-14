import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, FlaskConical } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTabParam } from '@/hooks/use-tab-param';
import analyticsService, { type AnalyticsInsights } from '../services/analyticsService';
import notesService, { type NotesAnalytics } from '../services/notesService';
import { logger } from '../utils/logger';
import NotesTrackingTab from './analytics/NotesTrackingTab';
import OverviewTab from './analytics/OverviewTab';
import { SAMPLE_NOTES, sampleInsights } from './analytics/sample-data';

const TAB_KEYS = ['overview', 'notes'] as const;
type TabKey = (typeof TAB_KEYS)[number];
const RANGES = [7, 30, 90] as const;
type Range = (typeof RANGES)[number];

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useTabParam(TAB_KEYS, 'overview');
  const [range, setRange] = useState<Range>(30);
  const [insights, setInsights] = useState<AnalyticsInsights | null>(null);
  const [notes, setNotes] = useState<NotesAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState({ insights: false, notes: false });
  // null = automatic: sample data shows only while there's no real data.
  const [sampleChoice, setSampleChoice] = useState<boolean | null>(null);

  const load = useCallback(async (days: Range) => {
    setLoading(true);
    const to = new Date();
    const from = new Date(to.getTime() - days * 86400000);
    const [i, n] = await Promise.allSettled([analyticsService.getInsights(from, to), notesService.getAnalytics()]);
    if (i.status === 'rejected') logger.error('Failed to load analytics insights:', i.reason);
    if (n.status === 'rejected') logger.error('Failed to load notes analytics:', n.reason);
    setInsights(i.status === 'fulfilled' ? i.value : null);
    setNotes(n.status === 'fulfilled' ? n.value : null);
    setFailed({ insights: i.status === 'rejected', notes: n.status === 'rejected' });
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(range), 0);
    return () => clearTimeout(t);
  }, [load, range]);

  const hasReal = activeTab === 'overview' ? (insights?.totals.events ?? 0) > 0 : (notes?.stats.totalNotes ?? 0) > 0;
  const sample = sampleChoice ?? (!loading && !hasReal);
  const sampleOverview = useMemo(() => sampleInsights(range), [range]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">How customers use the app — from first tap to placed order.</p>
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
                : failed.insights && activeTab === 'overview'
                  ? 'The server doesn’t provide these insights yet (deploy the latest backend). Real numbers replace this automatically.'
                  : 'No activity has been recorded yet. Real numbers replace this automatically once the app sends events.'}
            </p>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)} className="gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="notes">Shopping notes</TabsTrigger>
          </TabsList>
          {activeTab === 'overview' && (
            <Select value={String(range)} onValueChange={(v) => setRange(Number(v) as Range)}>
              <SelectTrigger size="sm" className="h-8 w-auto gap-2">
                <CalendarDays className="size-4 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RANGES.map((r) => (
                  <SelectItem key={r} value={String(r)}>
                    Last {r} days
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
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
