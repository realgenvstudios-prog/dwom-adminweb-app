import { useCallback, useEffect, useState } from 'react';
import { History, Loader2, RotateCw, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import ordersService, { type OrderHistory, type OrderPaymentRow } from '../../../services/ordersService';
import { can } from '../../../config/permissions';
import { logger } from '../../../utils/logger';
import { formatGhs } from '../order-status';
import type { Order } from '../OrderTypes';

const KIND_LABEL: Record<string, string> = {
  items_added: 'Items added',
  added_item_removed: 'Added item removed',
  item_unavailable: 'Item marked unavailable',
  item_replaced: 'Item replaced',
  item_removed: 'Item removed',
};
const PAYMENT_LABEL: Record<string, string> = {
  top_up: 'Extra paid online',
  at_door: 'Extra paid at the door',
  refund: 'Refund',
};
const STATUS_LABEL: Record<string, { label: string; tone: string }> = {
  paid: { label: 'Paid', tone: 'text-emerald-700' },
  to_collect: { label: 'Rider collects', tone: 'text-amber-700' },
  collected: { label: 'Collected', tone: 'text-emerald-700' },
  cancelled: { label: 'Cancelled', tone: 'text-muted-foreground' },
  refund_due: { label: 'To send', tone: 'text-amber-700' },
  refund_sent: { label: 'Sent, waiting on Paystack', tone: 'text-sky-700' },
  refunded: { label: 'Refunded', tone: 'text-emerald-700' },
  refund_failed: { label: 'Failed', tone: 'text-destructive' },
};
const when = (iso: string) => new Date(iso).toLocaleString([], { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

function describe(details: Record<string, unknown>): string {
  const items = (details.items as { name?: string; quantity?: number }[] | undefined) ?? [];
  const list = items.map((i) => `${i.quantity ?? ''} ${i.name ?? ''}`.trim()).join(', ');
  const removed = details.removed as string | undefined;
  if (removed && list) return `${removed} replaced with ${list}`;
  if (removed) return details.resolution === 'no_reply' ? `${removed} removed, no reply in time` : `${removed} removed`;
  const offered = details.offered as string[] | undefined;
  if (offered?.length) return `${list}. Offered: ${offered.join(', ')}`;
  return list;
}

// Everything that changed after the order was placed, and the money behind it.
export default function ChangesTab({ order, reloadKey, onChanged }: { order: Order; reloadKey: number; onChanged: () => void }) {
  const orderId = Number.parseInt(order.id, 10);
  const [history, setHistory] = useState<OrderHistory | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [refundOpen, setRefundOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      setHistory(await ordersService.getChanges(orderId));
    } catch (err) {
      logger.error('Failed to load order changes:', err);
      setError(err instanceof Error ? err.message : 'Couldn’t load the changes.');
    }
  }, [orderId]);

  useEffect(() => {
    void load();
  }, [load, reloadKey]);

  const send = async (payment: OrderPaymentRow) => {
    setBusyId(payment.id);
    try {
      await ordersService.sendRefund(orderId, { paymentId: payment.id });
      toast.success(`${formatGhs(payment.amount)} refund sent`);
      await load();
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Couldn’t send the refund.');
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const sendNew = async () => {
    setSending(true);
    try {
      await ordersService.sendRefund(orderId, { amount: Number(amount), reason: reason.trim() });
      toast.success(`${formatGhs(Number(amount))} refund sent`);
      setRefundOpen(false);
      setAmount('');
      setReason('');
      await load();
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Couldn’t send the refund.');
    } finally {
      setSending(false);
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
        {error}
        <Button variant="outline" size="sm" onClick={() => void load()}>
          <RotateCw />
          Retry
        </Button>
      </div>
    );
  }
  if (!history) return <Loader2 className="mx-auto mt-6 size-5 animate-spin text-muted-foreground" />;

  const canRefund = can('orders.refund');
  const online = order.paymentMethod !== 'cash';

  return (
    <div className="space-y-6 text-sm">
      {order.originalTotal != null && order.originalTotal !== order.total && (
        <div className="flex justify-between rounded-lg border bg-muted/40 px-4 py-3">
          <span className="text-muted-foreground">Placed at {formatGhs(order.originalTotal)}</span>
          <span className="font-semibold tabular-nums">Now {formatGhs(order.total)}</span>
        </div>
      )}

      <section className="space-y-2">
        <h3 className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          <Wallet className="size-3.5" />
          Extra payments and refunds
        </h3>
        {history.payments.length === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-center text-muted-foreground">None on this order.</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {history.payments.map((p) => {
              const status = STATUS_LABEL[p.status] ?? { label: p.status, tone: 'text-muted-foreground' };
              const canSend = canRefund && p.kind === 'refund' && (p.status === 'refund_due' || p.status === 'refund_failed');
              return (
                <li key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="min-w-40 flex-1">
                    <p className="font-medium">{PAYMENT_LABEL[p.kind] ?? p.kind}</p>
                    <p className="text-xs text-muted-foreground">
                      {when(p.createdAt)}
                      {p.reason ? ` · ${p.reason}` : ''}
                    </p>
                  </div>
                  <span className="font-medium tabular-nums">{formatGhs(p.amount)}</span>
                  <Badge variant="outline" className={`font-normal ${status.tone}`}>
                    {status.label}
                  </Badge>
                  {canSend && (
                    <Button size="sm" disabled={busyId === p.id} onClick={() => void send(p)}>
                      {busyId === p.id && <Loader2 className="animate-spin" />}
                      {p.status === 'refund_failed' ? 'Try again' : 'Send refund'}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {canRefund && online && (
          <Button variant="outline" size="sm" onClick={() => setRefundOpen(true)}>
            New refund
          </Button>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          <History className="size-3.5" />
          Changes
        </h3>
        {history.changes.length === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-center text-muted-foreground">No changes since it was placed.</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {history.changes.map((c) => (
              <li key={c.id} className="px-4 py-3">
                <div className="flex justify-between gap-3">
                  <p className="font-medium">{KIND_LABEL[c.kind] ?? c.kind}</p>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{when(c.createdAt)}</span>
                </div>
                <p className="text-muted-foreground">{describe(c.details)}</p>
                <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                  By {c.actor === 'system' ? 'DWOM automatically' : c.actor}
                  {c.totalBefore !== c.totalAfter ? ` · ${formatGhs(c.totalBefore)} to ${formatGhs(c.totalAfter)}` : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Refund through Paystack</DialogTitle>
            <DialogDescription>The money goes back to how the customer paid, usually within 3 to 10 working days. Paystack’s original fee isn’t returned.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="refund-amount">Amount</Label>
              <Input id="refund-amount" type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="tabular-nums" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="refund-reason">Reason</Label>
              <Textarea id="refund-reason" rows={2} maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundOpen(false)} disabled={sending}>
              Cancel
            </Button>
            <Button disabled={sending || !(Number(amount) > 0) || !reason.trim()} onClick={() => void sendNew()}>
              {sending && <Loader2 className="animate-spin" />}
              Send {Number(amount) > 0 ? formatGhs(Number(amount)) : 'refund'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
