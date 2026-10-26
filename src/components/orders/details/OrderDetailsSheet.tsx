import { useState } from 'react';
import { Bike, ChevronDown, CircleDollarSign, Loader2, PackageCheck, ShoppingBasket } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import ordersService from '../../../services/ordersService';
import { logger } from '../../../utils/logger';
import type { Order } from '../OrderTypes';
import { ORDER_STATUSES, PAYMENT_STATUSES, formatDateTime, formatGhs, orderStatusMeta, paymentStatusMeta } from '../order-status';
import ActivityTab from './ActivityTab';
import FeedbackTab from './FeedbackTab';
import ItemsTab from './ItemsTab';
import OverviewTab from './OverviewTab';
import { useOrderDetails } from './useOrderDetails';
import DispatchPanel from './DispatchPanel';
import { can } from '../../../config/permissions';

// Same options the old drawer offered. The backend would also accept
// 'cancelled' (which restocks items) — deliberately not exposed as a manual action.
const SETTABLE_PAYMENT = PAYMENT_STATUSES.filter((p) => p.value !== 'cancelled');

interface OrderDetailsSheetProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderChange: (id: string, patch: Partial<Order>) => void;
  onAssignRider: (order: Order) => void;
  onAssignPicker: (order: Order) => void;
}

export default function OrderDetailsSheet({ order: incoming, open, onOpenChange, onOrderChange, onAssignRider, onAssignPicker }: OrderDetailsSheetProps) {
  // Keep showing the last order while the sheet animates closed.
  const [lastOrder, setLastOrder] = useState(incoming);
  if (incoming && incoming !== lastOrder) setLastOrder(incoming);
  const order = incoming ?? lastOrder;

  const [reloadKey, setReloadKey] = useState(0);
  const { details, loading: detailsLoading, error: detailsError } = useOrderDetails(order ? order.id : null, reloadKey);
  const [busy, setBusy] = useState<null | 'status' | 'payment'>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [readyOpen, setReadyOpen] = useState(false);
  const [handlingNote, setHandlingNote] = useState('');

  if (!order) return null;

  const status = orderStatusMeta(order.orderStatus);
  const payment = paymentStatusMeta(order.paymentStatus);

  const updateStatus = async (next: string, notes?: string) => {
    if (next === order.orderStatus) return;
    try {
      setBusy('status');
      if (next === 'ready') await ordersService.markReady(Number.parseInt(order.id, 10), notes);
      else await ordersService.updateStatus(Number.parseInt(order.id, 10), next, notes);
      onOrderChange(order.id, { orderStatus: next });
      setReloadKey((k) => k + 1);
      toast.success(`Order #${order.id} marked ${orderStatusMeta(next).label.toLowerCase()}`);
    } catch (err) {
      logger.error('❌ [OrderDetails] Failed to update status:', err);
      toast.error(`Couldn't update the status. ${err instanceof Error ? err.message : ''}`.trim());
    } finally {
      setBusy(null);
    }
  };

  const updatePayment = async (next: string) => {
    if (next === order.paymentStatus) return;
    try {
      setBusy('payment');
      await ordersService.updatePaymentStatus(Number.parseInt(order.id, 10), next);
      onOrderChange(order.id, { paymentStatus: next });
      toast.success(`Payment marked ${paymentStatusMeta(next).label.toLowerCase()}`);
    } catch (err) {
      logger.error('❌ [OrderDetails] Failed to update payment status:', err);
      toast.error(`Couldn't update the payment status. ${err instanceof Error ? err.message : ''}`.trim());
    } finally {
      setBusy(null);
    }
  };

  const onPickStatus = (next: string) => {
    if (next === 'cancelled' && order.orderStatus !== 'cancelled') setConfirmCancel(true);
    // Ready goes through its own step so packers can leave a note for the rider.
    else if (next === 'ready') setReadyOpen(true);
    else updateStatus(next);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="flex flex-col gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-2xl data-[side=right]:xl:max-w-3xl">
          <SheetHeader className="gap-3 border-b p-6 pb-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pr-8">
              <SheetTitle className="text-xl tabular-nums">Order #{order.id}</SheetTitle>
              <div className="flex items-center gap-1.5 text-sm">
                <status.icon className={cn('size-4', status.tone)} />
                <span>{status.label}</span>
              </div>
              <Badge variant="outline" className={cn('font-medium', payment.badge)}>
                {payment.label}
              </Badge>
            </div>
            <SheetDescription>
              {order.customer} · placed {formatDateTime(order.createdAt)} · {formatGhs(order.total)}
            </SheetDescription>

            {details?.goodsWithRider && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-800">
                <span>
                  {details.cancelledBy === 'rider_no_show' ? 'Customer unreachable. ' : ''}The groceries are still with the rider, on their way back to the pickup point.
                </span>
                {can('orders.updateStatus') && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      try {
                        await ordersService.goodsReturned(Number.parseInt(order.id, 10));
                        setReloadKey((k) => k + 1);
                        toast.success('Marked as received back');
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : 'Couldn’t update it');
                      }
                    }}
                  >
                    Received back
                  </Button>
                )}
              </div>
            )}
            {details?.handlingNote && <p className="text-sm text-muted-foreground">Note for the rider: {details.handlingNote}</p>}
            <DispatchPanel orderId={order.id} status={order.orderStatus} hasRider={!!order.rider} onChanged={() => setReloadKey((k) => k + 1)} />

            <div className="flex flex-wrap gap-2 pt-1">
              {can('orders.updateStatus') && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" disabled={busy !== null}>
                      {busy === 'status' ? <Loader2 className="animate-spin" /> : <status.icon />}
                      Status
                      <ChevronDown className="opacity-60" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuLabel>Order status</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup value={order.orderStatus} onValueChange={onPickStatus}>
                      {ORDER_STATUSES.map((s) => (
                        <DropdownMenuRadioItem key={s.value} value={s.value}>
                          <s.icon className={s.tone} />
                          {s.label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {can('orders.updateStatus') && ['sorting', 'pending'].includes(order.orderStatus) && (
                <Button size="sm" variant="outline" onClick={() => setReadyOpen(true)} disabled={busy !== null}>
                  <PackageCheck />
                  Mark ready for pickup
                </Button>
              )}

              {can('orders.updatePayment') && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline" disabled={busy !== null}>
                      {busy === 'payment' ? <Loader2 className="animate-spin" /> : <CircleDollarSign />}
                      Payment
                      <ChevronDown className="opacity-60" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-44">
                    <DropdownMenuLabel>Payment status</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup value={order.paymentStatus} onValueChange={updatePayment}>
                      {SETTABLE_PAYMENT.map((p) => (
                        <DropdownMenuRadioItem key={p.value} value={p.value}>
                          {p.label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {can('orders.assignRider') && (
                <Button size="sm" variant="outline" onClick={() => onAssignRider(order)} disabled={busy !== null}>
                  <Bike />
                  {order.rider ? 'Reassign rider' : 'Assign rider'}
                </Button>
              )}
              {can('orders.assignPicker') && (
                <Button size="sm" variant="outline" onClick={() => onAssignPicker(order)} disabled={busy !== null}>
                  <ShoppingBasket />
                  {order.picker ? 'Reassign picker' : 'Assign picker'}
                </Button>
              )}
            </div>
          </SheetHeader>

          <Tabs defaultValue="overview" className="flex min-h-0 flex-1 flex-col gap-0">
            <div className="border-b px-6 pt-3 pb-3">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="items">
                  Items
                  <span className="ml-1 text-xs text-muted-foreground tabular-nums">{order.itemsCount}</span>
                </TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="feedback">Feedback</TabsTrigger>
              </TabsList>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-6">
              <TabsContent value="overview" className="mt-0">
                <OverviewTab order={order} details={details} detailsLoading={detailsLoading} />
              </TabsContent>
              <TabsContent value="items" className="mt-0">
                <ItemsTab items={details?.items ?? []} loading={detailsLoading} error={detailsError} />
              </TabsContent>
              <TabsContent value="activity" className="mt-0">
                <ActivityTab orderId={order.id} history={details?.statusHistory ?? []} historyLoading={detailsLoading} />
              </TabsContent>
              <TabsContent value="feedback" className="mt-0">
                <FeedbackTab details={details} loading={detailsLoading} />
              </TabsContent>
            </div>
          </Tabs>
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel order #{order.id}?</AlertDialogTitle>
            <AlertDialogDescription>
              The customer gets a notification that their order was cancelled, and the items’ stock is put back. You can change the status again later, but the notification can’t
              be unsent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea rows={2} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Reason (optional). The rider sees this if one is assigned." />
          <AlertDialogFooter>
            <AlertDialogCancel>Keep order</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => updateStatus('cancelled', cancelReason.trim() || undefined)}>
              Cancel order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={readyOpen} onOpenChange={setReadyOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Order #{order.id} is packed?</AlertDialogTitle>
            <AlertDialogDescription>The assigned rider can confirm pickup once it’s ready, and the customer is told their order is ready.</AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea rows={2} value={handlingNote} onChange={(e) => setHandlingNote(e.target.value)} placeholder="Note for the rider (optional), e.g. Fish, keep cold. 3 bags." />
          <AlertDialogFooter>
            <AlertDialogCancel>Not yet</AlertDialogCancel>
            <AlertDialogAction onClick={() => updateStatus('ready', handlingNote.trim() || undefined)}>Mark ready</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
