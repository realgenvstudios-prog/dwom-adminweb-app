import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CalendarClock, ExternalLink, Eye, Heart, Loader2, MousePointerClick, Plus, RotateCw, Send, ShoppingBag, Unplug, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatCard } from '@/components/stat-card';
import { useTabParam } from '@/hooks/use-tab-param';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import socialService, { type SocialAccount, type SocialPost } from '../services/socialService';
import { can } from '../config/permissions';
import { logger } from '../utils/logger';
import { formatGhs } from './orders/order-status';
import SocialPostDialog from './social/SocialPostDialog';
import { fmt, metricsOf, platformOf, statusOf, whenLabel } from './social/social-meta';

const TAB_KEYS = ['posts', 'results'] as const;
type TabKey = (typeof TAB_KEYS)[number];
const MONTH = 30 * 86_400_000;

function PlatformDots({ post }: { post: SocialPost }) {
  return (
    <span className="inline-flex flex-wrap gap-1.5">
      {post.targets.map((t) => (
        <span key={t.accountId} className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <span className={cn('size-2 rounded-full', platformOf(t.platform).dot)} />
          {platformOf(t.platform).label}
        </span>
      ))}
    </span>
  );
}

function PostCard({ post, onChanged, onCancel }: { post: SocialPost; onChanged: (p: SocialPost) => void; onCancel: (p: SocialPost) => void }) {
  const [syncing, setSyncing] = useState(false);
  const status = statusOf(post.status);
  const m = metricsOf(post);
  const live = post.status === 'scheduled' || post.status === 'publishing';
  const gone = post.status === 'published' || post.status === 'partial';
  const thumb = post.mediaUrls[0];

  const refresh = async () => {
    setSyncing(true);
    try {
      onChanged(await socialService.sync(post.id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Couldn’t refresh the post');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card className="gap-0 py-0">
      <CardContent className="flex gap-4 p-4">
        <div className="size-20 shrink-0 overflow-hidden rounded-lg border bg-muted">
          {thumb && (/\.(mp4|mov|m4v|webm)(\?|$)/i.test(thumb) ? <video src={thumb} className="size-full object-cover" muted /> : <img src={thumb} alt="" className="size-full object-cover" />)}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Badge variant="outline" className={status.className}>
              {status.label}
            </Badge>
            <span className="text-sm font-medium tabular-nums">{whenLabel(post)}</span>
            <PlatformDots post={post} />
          </div>
          <p className="line-clamp-2 text-sm whitespace-pre-line text-muted-foreground">{post.content}</p>

          {post.results && post.results.some((r) => r.url || r.error) && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
              {post.results.map((r) =>
                r.url ? (
                  <a key={r.accountId} href={r.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-foreground underline-offset-2 hover:underline">
                    View on {platformOf(r.platform).label}
                    <ExternalLink className="size-3" />
                  </a>
                ) : r.error ? (
                  <span key={r.accountId} className="text-destructive">
                    {platformOf(r.platform).label}: {r.error}
                  </span>
                ) : null,
              )}
            </div>
          )}
          {post.error && !post.results?.some((r) => r.error) && <p className="text-xs text-destructive">{post.error}</p>}

          {gone && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground tabular-nums">
              <span>Reach {fmt(m.reach)}</span>
              <span>Engagement {fmt(m.engagement)}</span>
              {post.linkCode && <span>Link taps {fmt(post.linkClicks)}</span>}
              {post.orders && (
                <span>
                  Orders {fmt(post.orders.count)} · {formatGhs(post.orders.revenue)}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex shrink-0 flex-col gap-1">
          {post.zernioPostId && post.status !== 'cancelled' && (
            <Button variant="ghost" size="icon" onClick={() => void refresh()} disabled={syncing} aria-label="Refresh from Zernio" title="Refresh">
              {syncing ? <Loader2 className="animate-spin" /> : <RotateCw />}
            </Button>
          )}
          {live && can('social.manage') && (
            <Button variant="ghost" size="icon" onClick={() => onCancel(post)} aria-label="Cancel post" title="Cancel post">
              <X />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ResultsTab({ posts, loading }: { posts: SocialPost[]; loading: boolean }) {
  const [now] = useState(() => Date.now());
  const out = posts.filter((p) => p.status === 'published' || p.status === 'partial');
  const month = out.filter((p) => new Date(p.publishedAt ?? p.createdAt).getTime() > now - MONTH);
  const sum = (list: SocialPost[], f: (p: SocialPost) => number | null | undefined) => list.reduce((s, p) => s + (f(p) ?? 0), 0);
  const withCodes = month.filter((p) => p.orders);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Posts out" value={String(month.length)} hint="Last 30 days" icon={Send} tint="bg-sky-500/10 text-sky-600" loading={loading} />
        <StatCard label="People reached" value={sum(month, (p) => metricsOf(p).reach).toLocaleString()} hint="As reported by each platform" icon={Eye} tint="bg-violet-500/10 text-violet-600" loading={loading} />
        <StatCard
          label="Engagement"
          value={sum(month, (p) => metricsOf(p).engagement).toLocaleString()}
          hint={`${sum(month, (p) => p.linkClicks).toLocaleString()} DWOM link taps`}
          icon={Heart}
          tint="bg-pink-500/10 text-pink-600"
          loading={loading}
        />
        <StatCard
          label="Orders from codes"
          value={sum(withCodes, (p) => p.orders?.count).toLocaleString()}
          hint={withCodes.length ? `${formatGhs(sum(withCodes, (p) => p.orders?.revenue))} in sales` : 'Add a discount code to a post to track sales'}
          icon={ShoppingBag}
          tint="bg-emerald-500/10 text-emerald-600"
          loading={loading}
        />
      </div>

      <Card className="gap-0 py-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Post</TableHead>
                <TableHead>Went out</TableHead>
                <TableHead className="text-right">Reach</TableHead>
                <TableHead className="text-right">Likes</TableHead>
                <TableHead className="text-right">Comments</TableHead>
                <TableHead className="text-right">Shares</TableHead>
                <TableHead className="text-right">Link taps</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Sales</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {out.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                    {loading ? 'Loading…' : 'Results show here once posts go out. Platforms take a few hours to report numbers.'}
                  </TableCell>
                </TableRow>
              )}
              {out.map((p) => {
                const m = metricsOf(p);
                return (
                  <TableRow key={p.id}>
                    <TableCell className="max-w-[320px] min-w-[220px]">
                      <p className="truncate text-sm">{p.content.split('\n')[0]}</p>
                      <PlatformDots post={p} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground tabular-nums">{whenLabel(p)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(m.reach)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(m.likes)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(m.comments)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(m.shares)}</TableCell>
                    <TableCell className="text-right tabular-nums">{p.linkCode ? fmt(p.linkClicks) : '—'}</TableCell>
                    <TableCell className="text-right tabular-nums">{p.orders ? fmt(p.orders.count) : '—'}</TableCell>
                    <TableCell className="text-right whitespace-nowrap tabular-nums">{p.orders ? formatGhs(p.orders.revenue) : '—'}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

export default function SocialPage() {
  usePermissions();
  const [tab, setTab] = useTabParam(TAB_KEYS, 'posts');
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogKey, setDialogKey] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState<SocialPost | null>(null);
  const [cancelBusy, setCancelBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [acc, list] = await Promise.all([socialService.accounts(), socialService.posts()]);
      setConfigured(acc.configured);
      setAccounts(acc.accounts);
      setPosts(list);
    } catch (err) {
      logger.error('Failed to load social posts:', err);
      setError(err instanceof Error ? err.message : 'Couldn’t load social posts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  const replace = (p: SocialPost) => setPosts((list) => list.map((x) => (x.id === p.id ? { ...x, ...p } : x)));

  const confirmCancel = async () => {
    if (!cancelling) return;
    setCancelBusy(true);
    try {
      replace(await socialService.cancel(cancelling.id));
      toast.success('Post cancelled');
      setCancelling(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Couldn’t cancel the post');
    } finally {
      setCancelBusy(false);
    }
  };

  const upcoming = posts.filter((p) => p.status === 'scheduled' || p.status === 'publishing').sort((a, b) => (a.scheduledFor ?? a.createdAt).localeCompare(b.scheduledFor ?? b.createdAt));
  const past = posts.filter((p) => !upcoming.includes(p)).sort((a, b) => (b.publishedAt ?? b.scheduledFor ?? b.createdAt).localeCompare(a.publishedAt ?? a.scheduledFor ?? a.createdAt));
  const needsReconnect = accounts.filter((a) => a.needsReconnection);
  const canCreate = configured && can('social.manage') && accounts.some((a) => a.active && !a.needsReconnection);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Social media</h1>
          <p className="text-sm text-muted-foreground">Schedule posts to every account at once, then see what each one reached and sold.</p>
        </div>
        {canCreate && (
          <Button onClick={() => setDialogKey(Date.now())}>
            <Plus />
            New post
          </Button>
        )}
      </div>

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="size-4" />
            {error}
          </div>
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RotateCw />
            Retry
          </Button>
        </div>
      )}

      {configured === false && (
        <Card className="gap-0 py-0">
          <CardContent className="flex items-start gap-4 p-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
              <Unplug className="size-5 text-muted-foreground" />
            </div>
            <div className="space-y-1 text-sm">
              <p className="font-medium">Social posting isn’t connected yet</p>
              <p className="text-muted-foreground">
                Connect DWOM’s accounts in Zernio, create an API key there, and add it on the server as <code className="rounded bg-muted px-1">ZERNIO_API_KEY</code>. This page fills in on the next
                load.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {configured && (
        <div className="flex flex-wrap items-center gap-2">
          {accounts.length === 0 && <p className="text-sm text-muted-foreground">No accounts connected in Zernio yet.</p>}
          {accounts.map((a) => (
            <span
              key={a.id}
              className={cn('inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm', a.needsReconnection && 'border-amber-500/40 bg-amber-500/5')}
              title={a.needsReconnection ? 'Reconnect in Zernio' : undefined}
            >
              {a.picture ? <img src={a.picture} alt="" className="size-5 rounded-full" /> : <span className={cn('size-2 rounded-full', platformOf(a.platform).dot)} />}
              <span className="font-medium">{platformOf(a.platform).label}</span>
              <span className="text-muted-foreground">@{a.username}</span>
              {a.followers != null && <span className="text-xs text-muted-foreground tabular-nums">· {a.followers.toLocaleString()} followers</span>}
            </span>
          ))}
          {needsReconnect.length > 0 && (
            <p className="w-full text-xs text-amber-700">
              {needsReconnect.map((a) => platformOf(a.platform).label).join(', ')} need{needsReconnect.length === 1 ? 's' : ''} reconnecting in Zernio before posts can go out there.
            </p>
          )}
        </div>
      )}

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="gap-6">
        <TabsList>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="flex flex-col gap-8">
          {loading ? (
            <div className="grid gap-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-28 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <>
              <section className="grid gap-3">
                <h2 className="flex items-center gap-2 text-sm font-medium">
                  <CalendarClock className="size-4 text-muted-foreground" />
                  Coming up <span className="text-muted-foreground tabular-nums">{upcoming.length}</span>
                </h2>
                {upcoming.length === 0 ? (
                  <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">Nothing scheduled. {canCreate ? 'Plan the week with New post.' : ''}</p>
                ) : (
                  upcoming.map((p) => <PostCard key={p.id} post={p} onChanged={replace} onCancel={setCancelling} />)
                )}
              </section>
              {past.length > 0 && (
                <section className="grid gap-3">
                  <h2 className="flex items-center gap-2 text-sm font-medium">
                    <MousePointerClick className="size-4 text-muted-foreground" />
                    Already out <span className="text-muted-foreground tabular-nums">{past.length}</span>
                  </h2>
                  {past.map((p) => (
                    <PostCard key={p.id} post={p} onChanged={replace} onCancel={setCancelling} />
                  ))}
                </section>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="results">
          <ResultsTab posts={posts} loading={loading} />
        </TabsContent>
      </Tabs>

      {dialogKey !== null && (
        <SocialPostDialog
          key={dialogKey}
          accounts={accounts}
          open
          onOpenChange={(o) => !o && setDialogKey(null)}
          onSaved={() => void load()}
        />
      )}

      <AlertDialog open={!!cancelling} onOpenChange={(o) => !o && !cancelBusy && setCancelling(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this post?</AlertDialogTitle>
            <AlertDialogDescription>It won’t go out on any account. You can create it again later.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelBusy}>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void confirmCancel();
              }}
              disabled={cancelBusy}
            >
              {cancelBusy && <Loader2 className="animate-spin" />}
              Cancel post
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
