import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CircleAlert,
  CircleCheck,
  CreditCard,
  Eye,
  KeyRound,
  Minus,
  Package,
  Plus,
  Search,
  ShoppingBag,
  Smartphone,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import apiClient from '../../services/apiClient';
import { logger } from '../../utils/logger';
import { formatGhs } from '../orders/order-status';

interface ActivityEvent {
  id: number;
  name: string;
  sessionId: string;
  platform?: string | null;
  appVersion?: string | null;
  // Shape varies by event name (see the backend's EVENT_TAXONOMY.md).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  properties?: Record<string, any> | null;
  occurredAt: string;
  asGuest: boolean;
}

// App screen (route) names as people would say them.
const SCREENS: Record<string, string> = {
  Home: 'Home',
  Categories: 'Categories',
  Bundles: 'Bundles',
  Discounts: 'Deals',
  Seasonal: 'In season',
  Search: 'Search',
  Cart: 'Cart',
  Checkout: 'Checkout',
  OrderSuccess: 'Order confirmed',
  Orders: 'Orders',
  TrackOrder: 'Track order',
  OrderHistoryDetails: 'Order details',
  RateOrder: 'Rate order',
  Profile: 'Profile',
  ProfileDetails: 'Profile details',
  Addresses: 'My addresses',
  SetDeliveryAddress: 'Set delivery address',
  Notes: 'DWOM notes',
  NoteReview: 'Notes review',
  Notifications: 'Notifications',
  Preferences: 'Preferences',
  SubscriptionPlans: 'Plans',
  SubscriptionDetails: 'Plan details',
  EditSubscriptionPlan: 'Edit plan',
  CreatePlanStep1: 'Create plan',
  CreatePlanStep2: 'Create plan · items',
  CreatePlanStep3: 'Create plan · review',
  GetHelp: 'Get help',
  ChatSupport: 'Chat support',
  FAQs: 'FAQs',
  HowTos: 'How-tos',
  Legal: 'Terms & privacy',
  Auth: 'Sign in',
  Onboarding: 'Onboarding',
  Splash: 'App opened',
};
const screenName = (s?: string) => (s ? SCREENS[s] ?? s.replace(/([a-z])([A-Z])/g, '$1 $2') : 'a screen');

type Tone = 'muted' | 'good' | 'bad' | 'warn';
interface Line {
  icon: LucideIcon;
  text: string;
  detail?: string;
  tone: Tone;
}

/** One event, in plain words. */
function describe(e: ActivityEvent): Line {
  const p = e.properties ?? {};
  switch (e.name) {
    case 'screen_viewed':
      return { icon: Smartphone, text: `Opened ${screenName(p.screenName)}`, tone: 'muted' };
    case 'search_performed':
      return p.resultCount === 0
        ? { icon: Search, text: `Searched “${p.query}”`, detail: 'No results', tone: 'warn' }
        : { icon: Search, text: `Searched “${p.query}”`, detail: `${p.resultCount} result${p.resultCount === 1 ? '' : 's'}`, tone: 'muted' };
    case 'product_viewed':
      return { icon: Eye, text: `Viewed ${p.productName || `product #${p.productId}`}`, detail: p.price != null ? formatGhs(Number(p.price)) : undefined, tone: 'muted' };
    case 'bundle_viewed':
      return { icon: Package, text: `Viewed bundle ${p.bundleName || `#${p.bundleId}`}`, tone: 'muted' };
    case 'cart_item_added':
      return { icon: Plus, text: `Added ${p.quantity ?? 1} × ${p.name ?? 'item'} to cart`, detail: p.price != null ? formatGhs(Number(p.price) * Number(p.quantity ?? 1)) : undefined, tone: 'muted' };
    case 'cart_item_removed':
      return { icon: Minus, text: 'Removed an item from the cart', tone: 'muted' };
    case 'checkout_started':
      return {
        icon: ShoppingBag,
        text: 'Started checkout',
        detail: [p.itemCount != null ? `${p.itemCount} item${p.itemCount === 1 ? '' : 's'}` : null, p.subtotal != null ? formatGhs(Number(p.subtotal)) : null, p.paymentMethod].filter(Boolean).join(' · '),
        tone: 'muted',
      };
    case 'checkout_failed':
      return { icon: CircleAlert, text: 'Checkout failed', detail: p.reason, tone: 'bad' };
    case 'order_placed':
      return { icon: CircleCheck, text: `Placed order #${p.orderId}`, detail: p.total != null ? formatGhs(Number(p.total)) : undefined, tone: 'good' };
    case 'payment_succeeded':
      return { icon: CreditCard, text: `Paid for order #${p.orderId}`, tone: 'good' };
    case 'payment_failed':
      return { icon: CreditCard, text: `Payment failed for order #${p.orderId}`, tone: 'bad' };
    case 'otp_requested':
      return { icon: KeyRound, text: `${p.resend ? 'Asked for a new' : 'Asked for a'} sign-in code`, detail: p.network, tone: 'muted' };
    case 'otp_verified':
      return { icon: KeyRound, text: 'Entered the sign-in code', detail: p.network, tone: 'good' };
    case 'otp_failed':
      return { icon: KeyRound, text: 'Sign-in code didn’t work', detail: [p.network, p.reason].filter(Boolean).join(' · '), tone: 'bad' };
    case 'signup_completed':
      return { icon: UserPlus, text: 'Finished signing up', tone: 'good' };
    default:
      return { icon: Smartphone, text: e.name.replace(/_/g, ' '), tone: 'muted' };
  }
}

const TONE: Record<Tone, string> = {
  muted: 'bg-muted text-muted-foreground',
  good: 'bg-emerald-500/10 text-emerald-600',
  bad: 'bg-destructive/10 text-destructive',
  warn: 'bg-amber-500/10 text-amber-600',
};

const time = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
const day = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

/** What a customer has done in the app: a summary, then a timeline by day and session. */
export default function CustomerActivity({ customerId }: { customerId: number }) {
  const [events, setEvents] = useState<ActivityEvent[] | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [failed, setFailed] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(
    async (before?: string) => {
      const q = new URLSearchParams({ limit: '300', ...(before ? { before } : {}) });
      const data = await apiClient.get<{ events: ActivityEvent[]; hasMore: boolean }>(`/users/admin/customers/${customerId}/activity?${q}`);
      return data;
    },
    [customerId],
  );

  useEffect(() => {
    let cancelled = false;
    load()
      .then((d) => {
        if (cancelled) return;
        setEvents(d.events ?? []);
        setHasMore(!!d.hasMore);
      })
      .catch((err) => {
        logger.error('Failed to fetch customer activity:', err);
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [load]);

  const loadMore = async () => {
    if (!events?.length) return;
    setLoadingMore(true);
    try {
      const d = await load(events[events.length - 1].occurredAt);
      setEvents((prev) => [...(prev ?? []), ...(d.events ?? [])]);
      setHasMore(!!d.hasMore);
    } catch (err) {
      logger.error('Failed to fetch more activity:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Summary, and the timeline grouped by day, then by app session.
  const view = useMemo(() => {
    if (!events) return null;
    const sessions = new Set(events.map((e) => e.sessionId));
    const screens = new Map<string, number>();
    const noResults = new Set<string>();
    for (const e of events) {
      if (e.name === 'screen_viewed' && e.properties?.screenName) screens.set(e.properties.screenName, (screens.get(e.properties.screenName) ?? 0) + 1);
      if (e.name === 'search_performed' && e.properties?.resultCount === 0 && e.properties?.query) noResults.add(String(e.properties.query));
    }
    const topScreens = [...screens.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);

    const days: { day: string; sessions: { id: string; events: ActivityEvent[] }[] }[] = [];
    for (const e of events) {
      const d = day(e.occurredAt);
      let dayGroup = days[days.length - 1];
      if (!dayGroup || dayGroup.day !== d) days.push((dayGroup = { day: d, sessions: [] }));
      let s = dayGroup.sessions[dayGroup.sessions.length - 1];
      if (!s || s.id !== e.sessionId) dayGroup.sessions.push((s = { id: e.sessionId, events: [] }));
      // The same screen twice in a row (e.g. a re-render) adds nothing.
      const prev = s.events[s.events.length - 1];
      if (prev && prev.name === 'screen_viewed' && e.name === 'screen_viewed' && prev.properties?.screenName === e.properties?.screenName) continue;
      s.events.push(e);
    }
    return { lastSeen: events[0]?.occurredAt, sessions: sessions.size, topScreens, noResults: [...noResults].slice(0, 8), days };
  }, [events]);

  if (failed) return <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">Couldn’t load this customer’s activity.</p>;
  if (!view)
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  if (view.days.length === 0)
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center">
        <Smartphone className="size-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No app activity recorded yet. Activity shows from the app version that records it onwards.</p>
      </div>
    );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Last seen</p>
          <p className="mt-0.5 text-sm font-medium">
            {view.lastSeen ? `${day(view.lastSeen)}, ${time(view.lastSeen)}` : '—'}
          </p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">App sessions{hasMore ? ' (recent)' : ''}</p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums">{view.sessions}</p>
        </div>
        {view.topScreens.length > 0 && (
          <div className="col-span-2 rounded-lg border p-3">
            <p className="mb-2 text-xs text-muted-foreground">Most visited</p>
            <div className="flex flex-wrap gap-1.5">
              {view.topScreens.map(([s, n]) => (
                <Badge key={s} variant="secondary" className="font-normal">
                  {screenName(s)} <span className="ml-1 text-muted-foreground tabular-nums">{n}</span>
                </Badge>
              ))}
            </div>
          </div>
        )}
        {view.noResults.length > 0 && (
          <div className="col-span-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
            <p className="mb-2 text-xs text-amber-700">Searched but found nothing</p>
            <div className="flex flex-wrap gap-1.5">
              {view.noResults.map((q) => (
                <Badge key={q} variant="outline" className="font-normal">
                  “{q}”
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {view.days.map((d) => (
        <section key={d.day} className="space-y-3">
          <h4 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{d.day}</h4>
          {d.sessions.map((s, si) => {
            const first = s.events[s.events.length - 1];
            const last = s.events[0];
            const guest = s.events.some((e) => e.asGuest);
            return (
              <div key={`${s.id}-${si}`} className="rounded-lg border">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground tabular-nums">
                    {time(first.occurredAt)}
                    {first.occurredAt !== last.occurredAt && `–${time(last.occurredAt)}`}
                  </span>
                  {first.platform && <span>· {first.platform === 'ios' ? 'iPhone' : first.platform === 'android' ? 'Android' : first.platform}</span>}
                  {first.appVersion && <span>· v{first.appVersion}</span>}
                  {guest && (
                    <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-normal">
                      started as guest
                    </Badge>
                  )}
                </div>
                <ol className="divide-y">
                  {s.events.map((e) => {
                    const l = describe(e);
                    return (
                      <li key={e.id} className="flex items-start gap-3 px-3 py-2 text-sm">
                        <span className={cn('mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md', TONE[l.tone])}>
                          <l.icon className="size-3.5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="break-words">{l.text}</p>
                          {!!l.detail && <p className={cn('text-xs', l.tone === 'bad' ? 'text-destructive' : l.tone === 'warn' ? 'text-amber-700' : 'text-muted-foreground')}>{l.detail}</p>}
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{time(e.occurredAt)}</span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            );
          })}
        </section>
      ))}

      {hasMore && (
        <Button variant="outline" className="w-full" onClick={() => void loadMore()} disabled={loadingMore}>
          {loadingMore ? 'Loading…' : 'Show older activity'}
        </Button>
      )}
    </div>
  );
}
