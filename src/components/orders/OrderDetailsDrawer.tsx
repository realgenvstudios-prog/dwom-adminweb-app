import React, { useState } from "react";
import type { Order } from "./OrderTypes";
import ordersService from "../../services/ordersService";

interface Props {
  open: boolean;
  order: Order | null;
  onClose: () => void;
  onOrderUpdated?: (updatedOrder: Partial<Order>) => void;
}

const OrderDetailsDrawer: React.FC<Props> = ({ open, order, onClose, onOrderUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [paymentDropdownOpen, setPaymentDropdownOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>(order?.orderStatus || "Pending");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>(order?.paymentStatus || "Pending");

  const statuses = ["Pending", "Preparing", "Ready", "On the way", "Delivered", "Canceled"];
  const paymentStatuses = ["Pending", "Paid", "Failed"];

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

  const handleReassignRider = async () => {
    if (!order) return;
    const riderId = prompt('Enter Rider ID:');
    if (!riderId) return;

    try {
      setLoading(true);
      console.log(`📦 [OrderDetailsDrawer] Assigning rider ${riderId} to order ${order.id}`);
      await ordersService.assignRider(parseInt(order.id), parseInt(riderId));
      console.log('✅ [OrderDetailsDrawer] Rider assigned');
      onOrderUpdated?.({});
      setPaymentDropdownOpen(false);
      alert('Rider assigned successfully');
    } catch (error) {
      console.error('❌ [OrderDetailsDrawer] Failed to assign rider:', error);
      alert('Failed to assign rider');
    } finally {
      setLoading(false);
    }
  };

  if (!open || !order) return null;

  return (
    <div className="fixed inset-0 z-40 flex">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity pointer-events-auto" onClick={onClose} />
      {/* Drawer */}
      <div className="ml-auto w-full max-w-xl bg-white h-full shadow-xl flex flex-col pointer-events-auto" style={{zIndex: 50}}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="text-lg font-bold text-gray-900">Order Details</div>
          <button className="text-gray-400 hover:text-gray-700" onClick={onClose} aria-label="Close">
            <span className="text-2xl">×</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-6">
          <div>
            <div className="font-semibold text-gray-700 mb-1">Order ID</div>
            <div className="text-gray-900 font-bold text-lg">{order.id}</div>
          </div>
          <div>
            <div className="font-semibold text-gray-700 mb-1">Customer</div>
            <div className="text-gray-900 font-bold text-lg">{order.customer}</div>
            <div className="text-xs text-gray-500">{order.phone} • {order.address}</div>
          </div>
          <div>
            <div className="font-semibold text-gray-700 mb-1">Zone</div>
            <div className="text-gray-900 font-medium">{order.zone}</div>
          </div>
          <div>
            <div className="font-semibold text-gray-700 mb-1">Current Status</div>
            <div className="text-gray-900 font-medium bg-blue-50 px-3 py-2 rounded inline-block">{selectedStatus}</div>
          </div>
          <div>
            <div className="font-semibold text-gray-700 mb-1">Payment Status</div>
            <div className="text-gray-900 font-medium bg-amber-50 px-3 py-2 rounded inline-block">{selectedPaymentStatus}</div>
          </div>
          <div>
            <div className="font-semibold text-gray-700 mb-1">Rider</div>
            <div className="text-gray-900 font-medium">{order.rider?.name || <span className='text-gray-400'>Not assigned</span>}</div>
          </div>
          <div>
            <div className="font-semibold text-gray-700 mb-1">Items</div>
            <ul className="divide-y divide-gray-100">
              {order.items.map((item, i) => (
                <li key={i} className="py-2 flex items-center justify-between">
                  <span className="text-xs text-gray-700">{item.name} × {item.quantity}</span>
                  <span className="text-xs font-semibold text-gray-700">GHS {item.price.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-semibold text-gray-700 mb-1">Timeline</div>
            <ul className="divide-y divide-gray-100">
              {order.timeline.map((t, i) => (
                <li key={i} className="py-1 flex items-center justify-between">
                  <span className="text-xs text-gray-500">{t.time}</span>
                  <span className="text-xs font-semibold text-gray-700">{t.status}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-semibold text-gray-700 mb-1">Payment Ref</div>
            <div className="text-xs text-gray-500">{order.paymentRef || <span className='text-gray-400'>—</span>}</div>
          </div>
          <div>
            <div className="font-semibold text-gray-700 mb-1">Coupon / Subscription</div>
            <div className="text-xs text-gray-500">{order.coupon || order.subscription || <span className='text-gray-400'>—</span>}</div>
          </div>
          <div className="flex gap-2 mt-2 flex-wrap">
            {/* Update Status */}
            <div className="relative">
              <button 
                disabled={loading}
                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                className="px-3 py-1 rounded bg-blue-100 text-blue-700 text-xs font-semibold hover:bg-blue-200 disabled:opacity-50"
              >
                Update Status
              </button>
              {statusDropdownOpen && (
                <div className="absolute top-full mt-1 bg-white border border-gray-200 rounded shadow-lg z-10 min-w-max">
                  {statuses.map(status => (
                    <button
                      key={status}
                      onClick={() => handleUpdateStatus(status)}
                      disabled={loading}
                      className="block w-full text-left px-4 py-2 text-xs hover:bg-blue-100 disabled:opacity-50"
                    >
                      {status}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Update Payment Status */}
            <div className="relative">
              <button 
                disabled={loading}
                onClick={() => setPaymentDropdownOpen(!paymentDropdownOpen)}
                className="px-3 py-1 rounded bg-amber-100 text-amber-700 text-xs font-semibold hover:bg-amber-200 disabled:opacity-50"
              >
                Update Payment
              </button>
              {paymentDropdownOpen && (
                <div className="absolute top-full mt-1 bg-white border border-gray-200 rounded shadow-lg z-10 min-w-max">
                  {paymentStatuses.map(status => (
                    <button
                      key={status}
                      onClick={() => handleUpdatePaymentStatus(status)}
                      disabled={loading}
                      className="block w-full text-left px-4 py-2 text-xs hover:bg-amber-100 disabled:opacity-50"
                    >
                      {status}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Reassign Rider */}
            <button 
              disabled={loading}
              onClick={handleReassignRider}
              className="px-3 py-1 rounded bg-green-100 text-green-700 text-xs font-semibold hover:bg-green-200 disabled:opacity-50"
            >
              Reassign Rider
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsDrawer;
