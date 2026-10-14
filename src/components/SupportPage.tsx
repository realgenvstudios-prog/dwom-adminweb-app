import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Clock, Hourglass, Inbox, MessagesSquare, RotateCw, Search, Send } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatCard } from '@/components/stat-card';
import { cn } from '@/lib/utils';
import supportService, { type ConversationState, type SupportConversation, type SupportMetrics } from '../services/supportService';
import { logger } from '../utils/logger';
import { ago, displayName, initials, minutesLabel, stateMeta } from './support/support-meta';
import ThreadPane from './support/ThreadPane';

type View = ConversationState | 'all';
const VIEWS: { value: View; label: string }[] = [
  { value: 'needs_reply', label: 'Needs reply' },
  { value: 'waiting', label: 'Replied' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'all', label: 'All' },
];
const POLL_MS = 30_000;

export default function SupportPage() {
  const [params, setParams] = useSearchParams();
  const view = (VIEWS.some((v) => v.value === params.get('view')) ? params.get('view') : 'needs_reply') as View;
  const selected = Number(params.get('customer')) || null;

  const [conversations, setConversations] = useState<SupportConversation[] | null>(null);
  const [metrics, setMetrics] = useState<SupportMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [tick, setTick] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  const setParam = (patch: Record<string, string | null>) =>
    setParams(
      (p) => {
        const next = new URLSearchParams(p);
        Object.entries(patch).forEach(([k, v]) => (v === null ? next.delete(k) : next.set(k, v)));
        return next;
      },
      { replace: true },
    );

  const load = useCallback(async () => {
    try {
      const [c, m] = await Promise.all([supportService.getConversations(), supportService.getSupportMetrics()]);
      setConversations(c);
      setMetrics(m);
      setError(null);
    } catch (err) {
      logger.error('Failed to load support inbox:', err);
      setError(err instanceof Error ? err.message : 'Failed to load support');
      setConversations((c) => c ?? []);
    }
    setNow(Date.now());
  }, []);

  // Poll so new customer messages show up without a manual refresh.
  useEffect(() => {
    const first = setTimeout(() => void load(), 0);
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') {
        void load();
        setTick((t) => t + 1);
      }
    }, POLL_MS);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [load]);

  const counts = useMemo(() => {
    const c: Record<View, number> = { needs_reply: 0, waiting: 0, resolved: 0, all: 0 };
    for (const x of conversations ?? []) {
      c[x.state]++;
      c.all++;
    }
    return c;
  }, [conversations]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (conversations ?? [])
      .filter((c) => view === 'all' || c.state === view)
      .filter((c) => !q || [c.customer, c.phone, c.email, c.lastMessage].some((v) => v?.toLowerCase().includes(q)))
      .sort((a, b) =>
        // Longest-waiting first when triaging; otherwise most recent first.
        view === 'needs_reply' ? new Date(a.waitingSince ?? a.lastMessageAt).getTime() - new Date(b.waitingSince ?? b.lastMessageAt).getTime() : b.lastMessageAt.localeCompare(a.lastMessageAt),
      );
  }, [conversations, view, query]);

  const longestWait = (conversations ?? []).filter((c) => c.state === 'needs_reply' && c.waitingSince).map((c) => now - new Date(c.waitingSince!).getTime());
  const longest = longestWait.length ? Math.round(Math.max(...longestWait) / 60000) : null;
  const loading = conversations === null;

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Support</h1>
        <p className="text-sm text-muted-foreground">Chats from the app’s Support screen. Replies reach the customer’s app with a notification.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Waiting for a reply"
          value={String(metrics?.needsReply ?? counts.needs_reply)}
          hint={longest !== null ? `Longest: ${minutesLabel(longest)}` : 'Nobody is waiting'}
          icon={Hourglass}
          tint="bg-amber-500/10 text-amber-600"
          loading={loading}
          failed={!!error}
        />
        <StatCard
          label="Typical first response"
          value={metrics?.medianFirstResponseMinutes != null ? minutesLabel(metrics.medianFirstResponseMinutes) : '—'}
          hint="Median over the last 30 days"
          icon={Clock}
          tint="bg-sky-500/10 text-sky-600"
          loading={loading}
          failed={!!error}
        />
        <StatCard label="Replies this week" value={String(metrics?.repliesLast7Days ?? 0)} hint="Messages sent by your team" icon={Send} tint="bg-violet-500/10 text-violet-600" loading={loading} failed={!!error} />
        <StatCard label="Resolved" value={String(metrics?.resolved ?? counts.resolved)} hint={`of ${metrics?.conversations ?? counts.all} conversations`} icon={CheckCircle2} tint="bg-emerald-500/10 text-emerald-600" loading={loading} failed={!!error} />
      </div>

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="size-4" />
            Couldn’t load support: {error}
          </div>
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RotateCw />
            Retry
          </Button>
        </div>
      )}

      <Card className="flex h-[calc(100vh-15rem)] min-h-[520px] flex-row gap-0 overflow-hidden p-0">
        <div className={cn('flex w-full flex-col border-r md:w-80 lg:w-96', selected && 'hidden md:flex')}>
          <div className="flex flex-col gap-3 border-b p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, phone, message…" className="h-8 pl-8" />
            </div>
            <Tabs value={view} onValueChange={(v) => setParam({ view: v })}>
              <TabsList className="w-full">
                {VIEWS.map((v) => (
                  <TabsTrigger key={v.value} value={v.value} className="gap-1 px-1.5 text-xs">
                    {v.label}
                    {counts[v.value] > 0 && v.value !== 'all' && <span className="text-muted-foreground tabular-nums">{counts[v.value]}</span>}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col gap-1 p-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : visible.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-12 text-center text-sm text-muted-foreground">
                <Inbox className="size-8" />
                {query ? 'No conversations match.' : view === 'needs_reply' ? 'All caught up — nobody is waiting.' : 'Nothing here.'}
              </div>
            ) : (
              <ul className="flex flex-col p-1.5">
                {visible.map((c) => {
                  const name = displayName(c);
                  const st = stateMeta(c.state);
                  const active = c.userId === selected;
                  return (
                    <li key={c.userId}>
                      <button
                        type="button"
                        onClick={() => setParam({ customer: String(c.userId) })}
                        className={cn('flex w-full gap-3 rounded-lg p-2.5 text-left transition-colors', active ? 'bg-muted' : 'hover:bg-muted/60')}
                      >
                        <div className="relative shrink-0">
                          <Avatar className="size-9">
                            <AvatarFallback className="text-xs">{initials(name)}</AvatarFallback>
                          </Avatar>
                          <span className={cn('absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-background', st.dot)} title={st.label} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <p className={cn('truncate text-sm', c.state === 'needs_reply' ? 'font-semibold' : 'font-medium')}>{name}</p>
                            <span className={cn('shrink-0 text-xs tabular-nums', c.state === 'needs_reply' ? 'font-medium text-amber-700' : 'text-muted-foreground')}>
                              {ago(c.state === 'needs_reply' && c.waitingSince ? c.waitingSince : c.lastMessageAt, now)}
                            </span>
                          </div>
                          <p className="truncate text-xs text-muted-foreground">
                            {c.lastSender === 'support' && <span className="text-foreground/70">You: </span>}
                            {c.lastMessage}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className={cn('min-w-0 flex-1 flex-col', selected ? 'flex' : 'hidden md:flex')}>
          {selected ? (
            <ThreadPane key={selected} userId={selected} refreshKey={tick} onBack={() => setParam({ customer: null })} onChanged={() => void load()} />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-sm text-muted-foreground">
              <MessagesSquare className="size-10" />
              <p className="font-medium text-foreground">Pick a conversation</p>
              <p>Customers waiting longest are at the top of “Needs reply”.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
