import { Bike, MessageSquareText, Package, Phone, ShoppingBasket, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { Order } from '../OrderTypes';
import { formatGhs, paymentMethodMeta } from '../order-status';
import type { OrderDetails } from './useOrderDetails';
import OrderEconomics from './OrderEconomics';
import AddressBlock from '../../address/AddressBlock';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</h3>
      {children}
    </section>
  );
}

function Person({ icon: Icon, label, name, sub, empty }: { icon: React.ComponentType<{ className?: string }>; label: string; name?: string; sub?: string; empty: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border p-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        {name ? (
          <>
            <p className="text-sm font-medium break-words">{name}</p>
            {sub && <p className="text-xs whitespace-nowrap text-muted-foreground tabular-nums">{sub}</p>}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">{empty}</p>
        )}
      </div>
    </div>
  );
}

interface OverviewTabProps {
  onAcknowledge?: () => void;
  order: Order;
  details: OrderDetails | null;
  detailsLoading: boolean;
}

export default function OverviewTab({ order, details, detailsLoading, onAcknowledge }: OverviewTabProps) {
  const method = paymentMethodMeta(order.paymentMethod);
  const charges = [
    { label: 'Subtotal', value: order.subtotal },
    { label: 'Delivery fee', value: order.deliveryFee },
    { label: 'Service fee', value: order.serviceFee },
    ...(order.smallOrderFee > 0 ? [{ label: 'Small order fee', value: order.smallOrderFee }] : []),
    ...(order.packagingFee > 0 ? [{ label: `Packaging${order.packagingName ? ` (${order.packagingName})` : ''}`, value: order.packagingFee }] : []),
    ...(order.couponDiscount > 0 ? [{ label: 'Discount', value: -order.couponDiscount }] : []),
  ];

  // What's been paid, what's still owed, and what's going back.
  const payments = details?.payments ?? [];
  const sumOf = (test: (p: { kind: string; status: string }) => boolean) => payments.filter(test).reduce((sum, p) => sum + p.amount, 0);
  const isCash = order.paymentMethod === 'cash';
  const paidFirst = !isCash && ['paid', 'completed'].includes(order.paymentStatus) ? (order.originalTotal ?? order.total) : 0;
  const extra = sumOf((p) => p.kind === 'top_up' && p.status === 'paid');
  const toSend = sumOf((p) => p.kind === 'refund' && (p.status === 'refund_due' || p.status === 'refund_failed'));
  const sent = sumOf((p) => p.kind === 'refund' && p.status === 'refund_sent');
  const refunded = sumOf((p) => p.kind === 'refund' && p.status === 'refunded');
  const rider = isCash ? Math.max(order.total - order.paidExtra, 0) : order.balanceAtDoor;
  const money = [
    { label: 'Paid online', value: paidFirst },
    { label: 'Extra paid online', value: extra },
    { label: 'Refund to send', value: toSend, warn: true },
    { label: 'Refund sent', value: sent },
    { label: 'Refunded', value: refunded },
    { label: order.orderStatus === 'delivered' ? 'Rider collected' : 'Rider collects', value: order.orderStatus === 'cancelled' ? 0 : rider, warn: order.orderStatus !== 'delivered' },
  ].filter((m) => m.value > 0);

  return (
    <div className="space-y-6">
      {order.openIssues > 0 && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800">Waiting for the customer to choose a replacement. The order can’t be marked Ready yet.</p>
      )}
      {order.newItemsToAcknowledge && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800">
          <span>The customer added items. See Items, make sure the picker has them, then acknowledge.</span>
          {onAcknowledge && (
            <Button size="sm" onClick={onAcknowledge}>
              Acknowledge
            </Button>
          )}
        </div>
      )}
      <Section title="People">
        <div className="grid gap-3 sm:grid-cols-3">
          <Person icon={User} label="Customer" name={order.customer} sub={order.phone} empty="Unknown" />
          <Person icon={Bike} label="Rider" name={order.rider?.name} empty="Not assigned" />
          <Person icon={ShoppingBasket} label="Picker" name={order.picker?.name} empty="Not assigned" />
        </div>
      </Section>

      <Section title="Delivery">
        <div className="space-y-3 rounded-lg border p-4 text-sm">
          <AddressBlock addressText={order.address} place={order.place} />
          {order.packagingName && (
            <div className="flex gap-3">
              <Package className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <p>
                <span className="text-muted-foreground">Pack in </span>
                {order.packagingName}
              </p>
            </div>
          )}
          {detailsLoading ? (
            <Skeleton className="h-4 w-48" />
          ) : (
            <>
              {details?.recipient && (
                <div className="flex gap-3">
                  <Phone className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <p>
                    <span className="text-muted-foreground">Hand to </span>
                    {details.recipient.name || 'None'}
                    {details.recipient.phone && <span className="tabular-nums"> · {details.recipient.phone}</span>}
                  </p>
                </div>
              )}
              {details?.riderNotes && (
                <div className="flex gap-3">
                  <MessageSquareText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <p className="italic">“{details.riderNotes}”</p>
                </div>
              )}
            </>
          )}
        </div>
      </Section>

      <Section title="Payment">
        <div className="overflow-hidden rounded-lg border text-sm">
          <dl className="divide-y">
            {charges.map((c) => (
              <div key={c.label} className="flex justify-between px-4 py-2">
                <dt className="text-muted-foreground">{c.label}</dt>
                <dd className="tabular-nums">{formatGhs(c.value)}</dd>
              </div>
            ))}
            <div className="flex justify-between bg-muted/50 px-4 py-2 font-semibold">
              <dt>Total{order.originalTotal != null && order.originalTotal !== order.total ? ` (was ${formatGhs(order.originalTotal)})` : ''}</dt>
              <dd className="tabular-nums">{formatGhs(order.total)}</dd>
            </div>
            {money.map((m) => (
              <div key={m.label} className="flex justify-between px-4 py-2">
                <dt className={m.warn ? 'font-medium text-amber-700' : 'text-muted-foreground'}>{m.label}</dt>
                <dd className="tabular-nums">{formatGhs(m.value)}</dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t px-4 py-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <method.icon className="size-3.5" />
              {method.label}
            </span>
            {order.paymentRef && <span className="font-mono break-all">Ref {order.paymentRef}</span>}
          </div>
        </div>
      </Section>

      <Section title="Economics (staff only)">
        <OrderEconomics key={order.id} orderId={order.id} />
      </Section>
    </div>
  );
}
