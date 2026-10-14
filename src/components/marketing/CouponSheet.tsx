import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Loader2, Pause, Pencil, Play, Send, Trash2 } from 'lucide-react';
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
import couponService, { type Coupon, type CouponStats } from '../../services/couponService';
import type { Campaign } from '../../services/marketingService';
import { logger } from '../../utils/logger';
import { formatDate } from '../customers/CustomerTypes';
import { formatGhs } from '../orders/order-status';
import { num } from './campaign-meta';
import { couponState, discountLabel, stateOf } from './coupon-meta';
import SendNotificationDialog from './SendNotificationDialog';

interface CouponSheetProps {
  coupon: Coupon;
  campaign: Campaign | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (c: Coupon) => void;
  onChanged: () => void;
}

export default function CouponSheet({ coupon: c, campaign, open, onOpenChange, onEdit, onChanged }: CouponSheetProps) {
  const [stats, setStats] = useState<CouponStats | null>(null);
  const [statsFailed, setStatsFailed] = useState(false);
  const [busy, setBusy] = useState<'toggle' | 'delete' | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [message, setMessage] = useState<{ token: number } | null>(null);
  const [messageOpen, setMessageOpen] = useState(false);
  const state = stateOf(couponState(c));

  useEffect(() => {
    let cancelled = false;
    couponService
      .getStats(c.id)
      .then((s) => !cancelled && setStats(s))
      .catch((err) => {
        logger.error('Failed to load code stats:', err);
        if (!cancelled) setStatsFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [c.id]);

  const usages = [...(stats?.usages ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const given = usages.reduce((s, u) => s + num(u.discount), 0);
  const customers = stats?.customers ?? [];
  const messageCustomers = () => {
    setMessage({ token: Date.now() });
    setMessageOpen(true);
  };

  const toggle = async () => {
    try {
      setBusy('toggle');
      await couponService.toggleStatus(c.id, !c.active);
      toast.success(c.active ? `${c.code} paused. Customers can’t use it` : `${c.code} is active again`);
      onChanged();
    } catch (err) {
      logger.error('Failed to toggle code:', err);
      toast.error('Couldn’t update the code.');
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    setConfirmDelete(false);
    try {
      setBusy('delete');
      await couponService.delete(c.id);
      toast.success(`${c.code} deleted`);
      onChanged();
      onOpenChange(false);
    } catch (err) {
      logger.error('Failed to delete code:', err);
      toast.error('Couldn’t delete the code.');
    } finally {
      setBusy(null);
    }
  };

  const copy = () => {
    void navigator.clipboard.writeText(c.code).then(
      () => toast.success('Code copied'),
      () => toast.error('Couldn’t copy'),
    );
  };

  const rules = [
    num(c.minOrderAmount) > 0 ? `Orders from ${formatGhs(num(c.minOrderAmount))}` : 'Any order size',
    `${c.usagePerUser} use${c.usagePerUser === 1 ? '' : 's'} per customer`,
    c.maxUses != null ? `${c.maxUses.toLocaleString()} uses in total` : 'No total limit',
    c.expiresAt ? `Valid until ${formatDate(c.expiresAt)}` : 'Never expires',
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-lg">
        <SheetHeader className="border-b p-6 pb-4">
          <Badge variant="outline" className={state.className}>
            {state.label}
          </Badge>
          <SheetTitle className="flex items-center gap-2 font-mono text-2xl tracking-wider">
            {c.code}
            <Button variant="ghost" size="icon-sm" onClick={copy} aria-label="Copy code">
              <Copy />
            </Button>
          </SheetTitle>
          <SheetDescription>
            {discountLabel(c)}
            {c.description ? ` · ${c.description}` : ''}
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6">
          <section className="grid grid-cols-3 gap-3">
            {[
              { label: 'Times used', value: c.usageCount.toLocaleString() },
              {
                label: 'Customers',
                value: stats ? stats.uniqueUsers.toLocaleString() : null,
              },
              {
                label: 'Discount given',
                value: stats ? formatGhs(given) : null,
              },
            ].map((m) => (
              <div key={m.label} className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">{m.label}</p>
                {m.value === null ? (
                  statsFailed ? (
                    <p className="mt-0.5 text-sm font-medium text-muted-foreground">Unavailable</p>
                  ) : (
                    <Skeleton className="mt-1.5 h-5 w-16" />
                  )
                ) : (
                  <p className="mt-0.5 text-lg font-semibold tabular-nums">{m.value}</p>
                )}
              </div>
            ))}
          </section>

          <section className="grid gap-2">
            <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Rules</h3>
            <ul className="grid gap-1 text-sm">
              {rules.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <p className="text-sm">
              <span className="text-muted-foreground">Campaign: </span>
              {campaign ? campaign.name : c.campaignId ? `#${c.campaignId}` : 'Not linked'}
            </p>
          </section>

          {customers.length > 0 && (
            <section className="grid gap-2">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Customers ({customers.length})</h3>
                <Button size="sm" variant="outline" onClick={messageCustomers}>
                  <Send />
                  Message {customers.length === 1 ? 'them' : `these ${customers.length}`}
                </Button>
              </div>
              <ul className="divide-y rounded-lg border text-sm">
                {customers.map((cu) => (
                  <li key={cu.userId} className="flex items-center gap-3 px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <Link to={`/customers?customer=${cu.userId}`} className="block truncate font-medium hover:underline">
                        {cu.name || 'Unnamed customer'}
                      </Link>
                      <p className="truncate text-xs text-muted-foreground tabular-nums">
                        {cu.phone ? `${cu.phone} · ` : ''}
                        {cu.uses} use{cu.uses === 1 ? '' : 's'} · last {formatDate(cu.lastUsedAt)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right tabular-nums">
                      <p>−{formatGhs(cu.totalDiscount)}</p>
                      <p className="text-xs text-muted-foreground">{cu.paidOrderValue > 0 ? `${formatGhs(cu.paidOrderValue)} paid` : 'Not paid yet'}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="grid gap-2">
            <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Recent uses</h3>
            {!stats && !statsFailed ? (
              <Skeleton className="h-24 w-full" />
            ) : usages.length === 0 ? (
              <p className="text-sm text-muted-foreground">{statsFailed ? 'Couldn’t load uses.' : 'Nobody has used this code yet.'}</p>
            ) : (
              <ul className="divide-y rounded-lg border text-sm">
                {usages.slice(0, 20).map((u) => (
                  <li key={u.id} className="flex items-center justify-between gap-3 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate">{u.User?.name || `Customer #${u.userId}`}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(u.createdAt)}</p>
                    </div>
                    {u.orderId ? (
                      <Link to={`/orders?order=${u.orderId}`} className="font-medium hover:underline">
                        Order #{u.orderId}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">No order</span>
                    )}
                    <span className="tabular-nums">−{formatGhs(num(u.discount))}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <SheetFooter className="flex-row flex-wrap items-center gap-2 border-t p-4">
          {c.usageCount === 0 && (
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setConfirmDelete(true)} disabled={!!busy}>
              <Trash2 />
              Delete
            </Button>
          )}
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={() => void toggle()} disabled={!!busy}>
              {busy === 'toggle' ? <Loader2 className="animate-spin" /> : c.active ? <Pause /> : <Play />}
              {c.active ? 'Pause' : 'Resume'}
            </Button>
            <Button size="sm" onClick={() => onEdit(c)} disabled={!!busy}>
              <Pencil />
              Edit
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>

      {message && <SendNotificationDialog key={message.token} initialUserIds={customers.map((cu) => cu.userId)} open={messageOpen} onOpenChange={setMessageOpen} />}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {c.code}?</AlertDialogTitle>
            <AlertDialogDescription>Nobody has used it yet, so nothing is lost. Customers who try it will be told it doesn’t exist.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => void remove()}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}
