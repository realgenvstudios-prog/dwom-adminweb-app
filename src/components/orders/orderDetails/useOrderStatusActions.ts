import { useEffect, useState } from "react";
import type { Order } from "../OrderTypes";
import ordersService from "../../../services/ordersService";

export const ORDER_STATUSES = ["sorting", "ready", "rider on the way", "rider has arrived", "delivered", "cancelled"];
export const PAYMENT_STATUSES = ["pending", "paid", "failed"];

// Normalize old status values to new format
export function normalizeStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'on_the_way': 'rider on the way',
    'arrived': 'rider has arrived',
  };
  return statusMap[status] || status;
}

// Map internal status values to display labels
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    "sorting": "Sorting",
    "ready": "Ready",
    "rider on the way": "Rider on the Way",
    "rider has arrived": "Rider Has Arrived",
    "delivered": "Delivered",
    "cancelled": "Cancelled",
    // Fallback for old statuses
    "on_the_way": "Rider on the Way",
    "arrived": "Rider Has Arrived",
  };
  return labels[status] || status;
}

export function getPaymentLabel(status: string): string {
  const labels: Record<string, string> = {
    "pending": "Pending",
    "paid": "Paid",
    "failed": "Failed",
  };
  return labels[status] || status;
}

export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    'sorting': 'bg-blue-100 text-blue-800 border-blue-300',
    'ready': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'rider on the way': 'bg-purple-100 text-purple-800 border-purple-300',
    'rider has arrived': 'bg-orange-100 text-orange-800 border-orange-300',
    'delivered': 'bg-green-100 text-green-800 border-green-300',
    'cancelled': 'bg-red-100 text-red-800 border-red-300',
  };
  return colorMap[status] || 'bg-gray-100 text-gray-800';
}

export function getPaymentColor(status: string): string {
  const colorMap: Record<string, string> = {
    'pending': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'paid': 'bg-green-100 text-green-800 border-green-300',
    'failed': 'bg-red-100 text-red-800 border-red-300',
  };
  return colorMap[status] || 'bg-gray-100 text-gray-800';
}

// Status/payment-status dropdowns + update actions. Split out of the
// former monolithic OrderDetailsDrawer. Takes loading/setLoading from the
// caller rather than owning its own — the original shared a single
// `loading` flag across status/payment/rider-assignment actions (disabling
// all three action buttons during any one of them), which splitting into
// independent hooks would otherwise silently drop.
export function useOrderStatusActions(
  order: Order | null,
  onOrderUpdated: ((updatedOrder: Partial<Order>) => void) | undefined,
  setLoading: (loading: boolean) => void,
) {
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [paymentDropdownOpen, setPaymentDropdownOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>(order?.orderStatus || "sorting");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>(order?.paymentStatus || "pending");

  useEffect(() => {
    if (!order) return;
    setSelectedStatus(normalizeStatus(order.orderStatus || 'sorting'));
    setSelectedPaymentStatus(order.paymentStatus || 'pending');
  }, [order]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!order) return;
    try {
      setLoading(true);
      console.log(`📦 [OrderDetailsDrawer] Updating order ${order.id} status to ${newStatus}`);
      await ordersService.updateStatus(parseInt(order.id), newStatus);
      setSelectedStatus(newStatus);
      setStatusDropdownOpen(false);
      console.log('✅ [OrderDetailsDrawer] Status updated instantly');
      // Update the UI immediately
      onOrderUpdated?.({ orderStatus: newStatus as any });
    } catch (error) {
      console.error('❌ [OrderDetailsDrawer] Failed to update status:', error);
      alert('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePaymentStatus = async (newPaymentStatus: string) => {
    if (!order) return;
    try {
      setLoading(true);
      console.log(`💰 [OrderDetailsDrawer] Updating order ${order.id} payment status to ${newPaymentStatus}`);

      // Call backend endpoint to update payment status
      // This would be: PATCH /orders/:id/payment-status
      await ordersService.updatePaymentStatus?.(parseInt(order.id), newPaymentStatus);

      setSelectedPaymentStatus(newPaymentStatus);
      setPaymentDropdownOpen(false);
      console.log('✅ [OrderDetailsDrawer] Payment status updated instantly');
      // Update the UI immediately
      onOrderUpdated?.({ paymentStatus: newPaymentStatus as any });
    } catch (error) {
      console.error('❌ [OrderDetailsDrawer] Failed to update payment status:', error);
      alert('Failed to update payment status');
    } finally {
      setLoading(false);
    }
  };

  return {
    statusDropdownOpen,
    setStatusDropdownOpen,
    paymentDropdownOpen,
    setPaymentDropdownOpen,
    selectedStatus,
    selectedPaymentStatus,
    handleUpdateStatus,
    handleUpdatePaymentStatus,
  };
}
