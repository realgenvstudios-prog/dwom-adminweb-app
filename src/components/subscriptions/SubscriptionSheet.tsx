import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, Mail, Pause, Phone, Play, XCircle } from 'lucide-react';
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
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import subscriptionsService, { type Subscription, type SubscriptionStatus } from '../../services/subscriptionsService';
import { logger } from '../../utils/logger';
import { formatDate } from '../customers/CustomerTypes';
import { formatGhs } from '../orders/order-status';
import { BILLING_STATUS, basketValue, customerName, monthlyValue, num, paymentFailing, scheduleLabel, statusOf } from './subscription-meta';

interface SubscriptionSheetProps {
  /** List row; the sheet loads full detail (items, billing history) itself. */
  subscription: Subscription;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}

export default function SubscriptionSheet({ subscription: row, open, onOpenChange, onChanged }: SubscriptionSheetProps) {
  const [detail, setDetail] = useState<Subscription | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState<SubscriptionStatus | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const s = detail ?? row;
  const status = statusOf(s.status);

  useEffect(() => {
    let cancelled = false;
    subscriptionsService
      .getSubscription(row.id)
      .then((d) => !cancelled && setDetail(d))
      .catch((err) => {
        logger.error('Failed to load subscription detail:', err);
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [row.id]);

  const change = async (next: SubscriptionStatus) => {
    setConfirmCancel(false);
    try {
      setBusy(next);
      setDetail(await subscriptionsService.setStatus(s.id, next));
      toast.success(next === 'paused' ? 'Paused — no charges until resumed' : next === 'active' ? 'Resumed' : 'Cancelled', {
        description: 'The customer was notified in the app.',
      });
      onChanged();
    } catch (err) {
      logger.error('Failed to change subscription status:', err);
      toast.error('Couldn’t update the subscription.');
    } finally {
      setBusy(null);
    }
  };

  const items = s.SubscriptionItem ?? [];
  const billings = detail?.SubscriptionBilling ?? [];
  const failing = paymentFailing(s);
  const address = s.Address ? `${s.Address.label} — ${s.Address.addressText}` : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl">
        <SheetHeader className="border-b p-6 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={status.className}>
              {status.label}
            </Badge>
            {failing && (
              <Badge variant="outline" className="border-red-500/20 bg-red-500/10 text-red-700">
                Payment failing
              </Badge>
            )}
          </div>
          <SheetTitle className="text-xl">{s.name || customerName(s)}</SheetTitle>
          <SheetDescription>
            {s.name ? `${customerName(s)} · ` : ''}
            {scheduleLabel(s)} · since {formatDate(s.createdAt)}
          </SheetDescription>
          <div className="flex flex-wrap gap-x-4 text-sm text-muted-foreground">
            {s.User?.phoneNumber && (
              <a href={`tel:${s.User.phoneNumber}`} className="inline-flex items-center gap-1 hover:text-foreground">
                <Phone className="size-3.5" />
                {s.User.phoneNumber}
              </a>
            )}
            {s.User?.email && (
              <a href={`mailto:${s.User.email}`} className="inline-flex items-center gap-1 hover:text-foreground">
                <Mail className="size-3.5" />
                {s.User.email}
              </a>
            )}
          </div>
        </SheetHeader>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6">
          {failing && (
            <div className="flex gap-2 rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-800">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <div>
                The last charge didn’t go through{billings[0]?.failureReason ? `: ${billings[0].failureReason}` : '.'}
                {billings[0]?.nextRetryDate && ` It’s retried automatically on ${formatDate(billings[0].nextRetryDate)}.`} Consider calling the customer.
              </div>
            </div>
          )}

          <section className="grid grid-cols-3 gap-3">
            {[
              { label: 'Per delivery', value: formatGhs(basketValue(s)) },
              { label: 'Per month', value: formatGhs(monthlyValue(s)) },
              { label: 'Spent so far', value: formatGhs(num(s.totalSpent)) },
            ].map((m) => (
              <div key={m.label} className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">{m.label}</p>
                <p className="mt-0.5 text-lg font-semibold tabular-nums">{m.value}</p>
              </div>
            ))}
          </section>

          <section className="grid gap-2">
            <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Basket ({items.length})</h3>
            <ul className="divide-y rounded-lg border text-sm">
              {items.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 px-3 py-2">
                  <span className="min-w-0">
                    <span className="font-medium">{i.quantity}×</span> {i.Product?.nameEnglish ?? `Product #${i.productId}`}
                    {i.Product?.active === false && <span className="ml-1.5 text-xs text-amber-700">(archived)</span>}
                    {Array.isArray(i.selectedVariations) && i.selectedVariations.some((v) => v?.label) && (
                      <span className="ml-1.5 text-xs text-sky-700">{i.selectedVariations.map((v) => v?.label).filter(Boolean).join(' · ')}</span>
                    )}
                  </span>
                  <span className="shrink-0 text-muted-foreground tabular-nums">
                    {formatGhs(num(i.unitPrice))} · <span className="text-foreground">{formatGhs(num(i.unitPrice) * i.quantity)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="grid gap-2">
            <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Schedule</h3>
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm">
              <dt className="text-muted-foreground">Next billing</dt>
              <dd>{s.status === 'active' ? formatDate(s.nextBillingDate) : '—'}</dd>
              <dt className="text-muted-foreground">Payment</dt>
              <dd className="capitalize">{s.autoCharge === false ? 'Manual' : (s.paymentMethod?.replace('_', ' ') ?? 'Auto-charge')}</dd>
              <dt className="text-muted-foreground">Deliveries</dt>
              <dd>{s.totalCharges ?? 0} charged</dd>
              {address && (
                <>
                  <dt className="text-muted-foreground">Deliver to</dt>
                  <dd>{address}</dd>
                </>
              )}
            </dl>
          </section>

          <section className="grid gap-2">
            <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Billing history</h3>
            {!detail && !failed ? (
              <Skeleton className="h-24 w-full" />
            ) : billings.length === 0 ? (
              <p className="text-sm text-muted-foreground">{failed ? 'Couldn’t load billing history.' : 'No charges yet.'}</p>
            ) : (
              <ul className="divide-y rounded-lg border text-sm">
                {billings.map((b) => {
                  const st = BILLING_STATUS[b.status] ?? { label: b.status, className: '' };
                  return (
                    <li key={b.id} className="flex items-center justify-between gap-3 px-3 py-2">
                      <div className="min-w-0">
                        <p>{formatDate(b.billingDate)}</p>
                        {b.failureReason && <p className="truncate text-xs text-red-700">{b.failureReason}</p>}
                        {b.retryCount > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Retry {b.retryCount} of {b.maxRetries}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="tabular-nums">{formatGhs(num(b.amount))}</span>
                        <Badge variant="outline" className={st.className}>
                          {st.label}
                        </Badge>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {s.status !== 'cancelled' && (
          <SheetFooter className="flex-row flex-wrap items-center gap-2 border-t p-4">
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setConfirmCancel(true)} disabled={!!busy}>
              {busy === 'cancelled' ? <Loader2 className="animate-spin" /> : <XCircle />}
              Cancel subscription
            </Button>
            <div className="ml-auto">
              {s.status === 'active' ? (
                <Button variant="outline" size="sm" onClick={() => void change('paused')} disabled={!!busy}>
                  {busy === 'paused' ? <Loader2 className="animate-spin" /> : <Pause />}
                  Pause
                </Button>
              ) : (
                <Button size="sm" onClick={() => void change('active')} disabled={!!busy}>
                  {busy === 'active' ? <Loader2 className="animate-spin" /> : <Play />}
                  Resume
                </Button>
              )}
            </div>
          </SheetFooter>
        )}
      </SheetContent>

      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              {customerName(s)} won’t be charged or receive deliveries again, and gets a notification. A cancelled subscription can’t be restarted — they’d need to
              create a new one. Pausing is reversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => void change('cancelled')}>
              Cancel subscription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}
