import { Bike, MapPin, MessageSquareText, Phone, ShoppingBasket, User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Order } from '../OrderTypes';
import { formatGhs, paymentMethodMeta } from '../order-status';
import type { OrderDetails } from './useOrderDetails';
import OrderEconomics from './OrderEconomics';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</h3>
      {children}
    </section>
  );
}

function Person({
  icon: Icon,
  label,
  name,
  sub,
  empty,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  name?: string;
  sub?: string;
  empty: string;
}) {
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
  order: Order;
  details: OrderDetails | null;
  detailsLoading: boolean;
}

export default function OverviewTab({ order, details, detailsLoading }: OverviewTabProps) {
  const method = paymentMethodMeta(order.paymentMethod);
  const charges = [
    { label: 'Subtotal', value: order.subtotal },
    { label: 'Delivery fee', value: order.deliveryFee },
    { label: 'Service fee', value: order.serviceFee },
    ...(order.couponDiscount > 0 ? [{ label: 'Discount', value: -order.couponDiscount }] : []),
  ];

  return (
    <div className="space-y-6">
      <Section title="People">
        <div className="grid gap-3 sm:grid-cols-3">
          <Person icon={User} label="Customer" name={order.customer} sub={order.phone} empty="Unknown" />
          <Person icon={Bike} label="Rider" name={order.rider?.name} empty="Not assigned" />
          <Person icon={ShoppingBasket} label="Picker" name={order.picker?.name} empty="Not assigned" />
        </div>
      </Section>

      <Section title="Delivery">
        <div className="space-y-3 rounded-lg border p-4 text-sm">
          <div className="flex gap-3">
            <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <p>{order.address || 'No address on file'}</p>
          </div>
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
              <dt>Total</dt>
              <dd className="tabular-nums">{formatGhs(order.total)}</dd>
            </div>
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
