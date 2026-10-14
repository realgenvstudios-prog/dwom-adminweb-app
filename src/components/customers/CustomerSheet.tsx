import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ChevronDown, ExternalLink, Mail, MapPin, Package, Phone } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import apiClient from '../../services/apiClient';
import { logger } from '../../utils/logger';
import {
  formatDateTime,
  formatGhs,
  normalizeOrderStatus,
  normalizePaymentStatus,
  orderStatusMeta,
  paymentMethodMeta,
  paymentStatusMeta,
} from '../orders/order-status';
import { customerStatusMeta, formatDate, initialsOf, timeAgo, type Customer, type CustomerOrder } from './CustomerTypes';

interface CustomerSheetProps {
  customer: Customer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canOpenOrders: boolean;
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums">{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function OrderRow({ order, canOpenOrders }: { order: CustomerOrder; canOpenOrders: boolean }) {
  const status = orderStatusMeta(normalizeOrderStatus(order.status));
  const payment = paymentStatusMeta(normalizePaymentStatus(order.paymentStatus));
  const method = paymentMethodMeta(order.paymentMethod);
  // The history endpoint doesn't return couponDiscount; show whatever the fees don't explain.
  const discount = order.subtotal + order.deliveryFee + order.serviceFee - order.total;

  return (
    <Collapsible asChild>
      <li className="group/order">
        <CollapsibleTrigger className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50">
          <status.icon className={cn('size-4 shrink-0', status.tone)} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">
              Order #{order.id}
              <span className="ml-2 font-normal text-muted-foreground">{formatDateTime(order.createdAt)}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {status.label} · {order.items.length} item{order.items.length === 1 ? '' : 's'}
            </p>
          </div>
          <Badge variant="outline" className={cn('font-medium', payment.badge)}>
            {payment.label}
          </Badge>
          <span className="w-24 text-right text-sm font-medium tabular-nums">{formatGhs(order.total)}</span>
          <ChevronDown className="size-4 text-muted-foreground transition-transform group-data-[state=open]/order:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
          <div className="space-y-3 border-t bg-muted/30 px-4 py-3 text-sm">
            <ul className="space-y-1.5">
              {order.items.map((item, i) => (
                <li key={i} className="flex justify-between gap-3">
                  <span className="min-w-0 truncate">
                    <span className="text-muted-foreground tabular-nums">{item.quantity}× </span>
                    {item.name}
                  </span>
                  <span className="shrink-0 tabular-nums">{formatGhs(item.total)}</span>
                </li>
              ))}
            </ul>
            <dl className="space-y-1 border-t pt-2 text-xs">
              {[
                ['Subtotal', order.subtotal],
                ['Delivery', order.deliveryFee],
                ['Service fee', order.serviceFee],
                ...(discount >= 0.01 ? [['Discount', -discount] as const] : []),
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-muted-foreground">
                  <dt>{label}</dt>
                  <dd className="tabular-nums">{formatGhs(Number(value))}</dd>
                </div>
              ))}
              <div className="flex justify-between border-t pt-1 font-medium">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatGhs(order.total)}</dd>
              </div>
            </dl>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <method.icon className="size-3.5" />
                {method.label}
                {order.address && <span className="truncate">· {order.address}</span>}
              </span>
              {canOpenOrders && (
                <Link to={`/orders?order=${order.id}`} className="flex items-center gap-1 text-foreground hover:underline">
                  Open in Orders
                  <ExternalLink className="size-3" />
                </Link>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </li>
    </Collapsible>
  );
}

export default function CustomerSheet({ customer, open, onOpenChange, canOpenOrders }: CustomerSheetProps) {
  const [orders, setOrders] = useState<CustomerOrder[] | null>(null);
  const [failed, setFailed] = useState(false);
  const status = customerStatusMeta(customer.status);

  // Mounted per customer (key), so state starts fresh.
  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<CustomerOrder[]>(`/users/admin/customers/${customer.id}/orders`)
      .then((data) => !cancelled && setOrders(Array.isArray(data) ? data : []))
      .catch((err) => {
        logger.error('Failed to fetch order history:', err);
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [customer.id]);

  // List stats divide paid spend by *all* orders; work out a true average here.
  const paid = (orders ?? []).filter((o) => normalizePaymentStatus(o.paymentStatus) === 'paid');
  const avgPaid = paid.length ? paid.reduce((s, o) => s + o.total, 0) / paid.length : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl">
        <SheetHeader className="gap-3 border-b p-6 pb-4">
          <div className="flex items-center gap-4 pr-8">
            <Avatar className="size-14">
              <AvatarFallback className="text-lg">{initialsOf(customer.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 space-y-1">
              <SheetTitle className="text-xl">{customer.name}</SheetTitle>
              <SheetDescription className="flex items-center gap-2">
                <span className="tabular-nums">Customer #{customer.id}</span>
                <Badge variant="outline" className={cn('font-medium', status.badge)}>
                  {status.label}
                </Badge>
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <Tabs defaultValue="orders" className="flex min-h-0 flex-1 flex-col gap-0">
          <div className="border-b px-6 py-3">
            <TabsList>
              <TabsTrigger value="orders">
                Orders
                <span className="ml-1 text-xs text-muted-foreground tabular-nums">{customer.totalOrders}</span>
              </TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
            </TabsList>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-6">
            <TabsContent value="orders" className="mt-0 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <Stat label="Paid spend" value={formatGhs(customer.totalSpend)} />
                <Stat label="Avg paid order" value={orders ? formatGhs(avgPaid) : '…'} hint={orders ? `${paid.length} paid` : undefined} />
                <Stat label="Last order" value={timeAgo(customer.lastOrder)} />
              </div>
              {failed ? (
                <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">Couldn’t load this customer’s orders.</p>
              ) : orders === null ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center">
                  <Package className="size-6 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No orders yet.</p>
                </div>
              ) : (
                <ul className="divide-y overflow-hidden rounded-lg border">
                  {orders.map((o) => (
                    <OrderRow key={o.id} order={o} canOpenOrders={canOpenOrders} />
                  ))}
                </ul>
              )}
            </TabsContent>
            <TabsContent value="profile" className="mt-0">
              <dl className="divide-y rounded-lg border text-sm">
                {[
                  { icon: Phone, label: 'Phone', value: customer.phone || '—' },
                  { icon: Mail, label: 'Email', value: customer.email || 'No email' },
                  { icon: MapPin, label: 'First saved address', value: customer.address || 'No address saved' },
                  { icon: Calendar, label: 'Joined', value: formatDate(customer.createdAt) },
                ].map((r) => (
                  <div key={r.label} className="flex items-start gap-3 px-4 py-3">
                    <r.icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <dt className="w-36 shrink-0 text-muted-foreground">{r.label}</dt>
                    <dd className="min-w-0 break-words">{r.value}</dd>
                  </div>
                ))}
              </dl>
            </TabsContent>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
