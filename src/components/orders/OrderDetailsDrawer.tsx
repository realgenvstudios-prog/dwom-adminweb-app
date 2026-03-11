import React, { useEffect, useMemo, useState } from "react";
import type { Order } from "./OrderTypes";
import ordersService from "../../services/ordersService";
import ridersService, { type RiderData } from "../../services/ridersService";

interface Props {
  open: boolean;
  order: Order | null;
  onClose: () => void;
  onOrderUpdated?: (updatedOrder: Partial<Order>) => void;
}

const OrderDetailsDrawer: React.FC<Props> = ({ open, order, onClose, onOrderUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [detailsItems, setDetailsItems] = useState<Order['items']>([]);
  const [riderRatingData, setRiderRatingData] = useState<{ rating: number; comment?: string } | null>(null);
  const [productReviewsData, setProductReviewsData] = useState<Array<{ productId: number; productName: string; rating: number; comment?: string }>>([]);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [paymentDropdownOpen, setPaymentDropdownOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>(order?.orderStatus || "sorting");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>(order?.paymentStatus || "pending");
  
  // Rider assignment modal state
  const [riderModalOpen, setRiderModalOpen] = useState(false);
  const [availableRiders, setAvailableRiders] = useState<RiderData[]>([]);
  const [ridersLoading, setRidersLoading] = useState(false);
  const [selectedRiderId, setSelectedRiderId] = useState<number | null>(null);

  const orderIdNum = useMemo(() => {
    if (!order?.id) return null;
    const idNum = Number.parseInt(order.id, 10);
    return Number.isFinite(idNum) ? idNum : null;
  }, [order?.id]);

  // Normalize old status values to new format
  const normalizeStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      'on_the_way': 'rider on the way',
      'arrived': 'rider has arrived',
    };
    return statusMap[status] || status;
  };

  useEffect(() => {
    if (!order) return;
    setSelectedStatus(normalizeStatus(order.orderStatus || 'sorting'));
    setSelectedPaymentStatus(order.paymentStatus || 'pending');
  }, [order]);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!open || !orderIdNum) return;
      try {
        setDetailsLoading(true);
        setDetailsError(null);
        console.log(`📦 [OrderDetailsDrawer] Fetching full order details for ${orderIdNum}`);
        const fullOrder: any = await ordersService.getById(orderIdNum);

        const productItems = (fullOrder?.OrderItem || []).map((item: any) => {
          const unitPrice = Number(item.unitPrice || 0);
          const discountPercent = Number(item.discount || 0);
          const discountedPrice = Number(item.discountedPrice || item.discounted_price || 0);
          const effectivePrice = discountedPrice > 0 ? discountedPrice
            : (discountPercent > 0 ? unitPrice * (1 - discountPercent / 100) : unitPrice);
          return {
            id: item.id?.toString() || `product-${item.productId}`,
            name: item.Product?.nameEnglish || `Product ${item.productId}`,
            quantity: item.quantity || 0,
            price: effectivePrice,
            originalPrice: effectivePrice < unitPrice ? unitPrice : undefined,
          };
        });

        const bundleItems = (fullOrder?.BundleOrderItem || []).map((item: any) => {
          const unitPrice = Number(item.unitPrice || 0);
          const discountPercent = Number(item.discount || 0);
          const discountedPrice = Number(item.discountedPrice || item.discounted_price || 0);
          const effectivePrice = discountedPrice > 0 ? discountedPrice
            : (discountPercent > 0 ? unitPrice * (1 - discountPercent / 100) : unitPrice);
          return {
            id: `bundle-${item.id}`,
            name: `📦 ${item.Bundle?.name || `Bundle ${item.bundleId}`}`,
            quantity: item.quantity || 0,
            price: effectivePrice,
            originalPrice: effectivePrice < unitPrice ? unitPrice : undefined,
          };
        });

        setDetailsItems([...productItems, ...bundleItems]);

        // Extract ratings from full order data
        const riderRating = fullOrder?.RiderRating?.[0];
        if (riderRating) {
          setRiderRatingData({ rating: riderRating.rating, comment: riderRating.comment });
        } else {
          setRiderRatingData(null);
        }

        const reviews = (fullOrder?.ProductReview || []).map((review: any) => ({
          productId: review.productId,
          productName: review.Product?.nameEnglish || `Product ${review.productId}`,
          rating: review.rating,
          comment: review.comment,
        }));
        setProductReviewsData(reviews);

        console.log('✅ [OrderDetailsDrawer] Loaded items:', productItems.length + bundleItems.length, 'ratings:', riderRating ? 'yes' : 'no', 'reviews:', reviews.length);
      } catch (e: any) {
        console.error('❌ [OrderDetailsDrawer] Failed to load order details:', e);
        setDetailsError(e?.message || 'Failed to load order items');
        setDetailsItems([]);
      } finally {
        setDetailsLoading(false);
      }
    };

    fetchDetails();
  }, [open, orderIdNum]);

  // New order statuses: sorting → ready → rider on the way → rider has arrived → delivered (+ cancelled anytime)
  const statuses = ["sorting", "ready", "rider on the way", "rider has arrived", "delivered", "cancelled"];
  const paymentStatuses = ["pending", "paid", "failed"];

  // Map internal status values to display labels
  const getStatusLabel = (status: string): string => {
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
  };

  const getPaymentLabel = (status: string): string => {
    const labels: Record<string, string> = {
      "pending": "Pending",
      "paid": "Paid",
      "failed": "Failed",
    };
    return labels[status] || status;
  };

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

  // Fetch available riders when modal opens
  const openRiderModal = async () => {
    setRiderModalOpen(true);
    setRidersLoading(true);
    try {
      console.log('🚴 [OrderDetailsDrawer] Fetching available riders');
      const riders = await ridersService.getAllRiders();
      // Filter to only show active/available riders
      const activeRiders = riders.filter(r => r.isActive);
      setAvailableRiders(activeRiders);
      console.log('✅ [OrderDetailsDrawer] Loaded', activeRiders.length, 'active riders');
    } catch (error) {
      console.error('❌ [OrderDetailsDrawer] Failed to fetch riders:', error);
      setAvailableRiders([]);
    } finally {
      setRidersLoading(false);
    }
  };

  const handleAssignRider = async () => {
    if (!order || !selectedRiderId) return;

    try {
      setLoading(true);
      console.log(`📦 [OrderDetailsDrawer] Assigning rider ${selectedRiderId} to order ${order.id}`);
      await ordersService.assignRider(parseInt(order.id), selectedRiderId);
      
      const assignedRider = availableRiders.find(r => r.id === selectedRiderId);
      console.log('✅ [OrderDetailsDrawer] Rider assigned');
      
      onOrderUpdated?.({ 
        rider: assignedRider ? { id: String(assignedRider.id), name: assignedRider.name } : null 
      });
      setRiderModalOpen(false);
      setSelectedRiderId(null);
    } catch (error) {
      console.error('❌ [OrderDetailsDrawer] Failed to assign rider:', error);
      alert('Failed to assign rider');
    } finally {
      setLoading(false);
    }
  };

  if (!open || !order) return null;

  const getStatusColor = (status: string): string => {
    const colorMap: Record<string, string> = {
      'sorting': 'bg-blue-100 text-blue-800 border-blue-300',
      'ready': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'rider on the way': 'bg-purple-100 text-purple-800 border-purple-300',
      'rider has arrived': 'bg-orange-100 text-orange-800 border-orange-300',
      'delivered': 'bg-green-100 text-green-800 border-green-300',
      'cancelled': 'bg-red-100 text-red-800 border-red-300',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentColor = (status: string): string => {
    const colorMap: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'paid': 'bg-green-100 text-green-800 border-green-300',
      'failed': 'bg-red-100 text-red-800 border-red-300',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 z-40 flex">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity pointer-events-auto" onClick={onClose} />
      {/* Drawer */}
      <div className="ml-auto w-full max-w-2xl bg-white h-full shadow-xl flex flex-col pointer-events-auto" style={{zIndex: 50}}>
        {/* Sticky Header with Actions */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-2xl font-bold text-gray-900">Order #{order.id}</div>
              <div className="text-sm text-gray-500">{order.customer}</div>
            </div>
            <button className="text-gray-400 hover:text-gray-600 p-1" onClick={onClose} aria-label="Close">
              <span className="text-2xl font-light">×</span>
            </button>
          </div>

          {/* Status Pills */}
          <div className="flex gap-3 flex-wrap mb-4">
            <div>
              <div className="text-xs font-medium text-gray-600 mb-1">Order Status</div>
              <div className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(selectedStatus)}`}>
                {getStatusLabel(selectedStatus)}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-600 mb-1">Payment</div>
              <div className={`px-3 py-1 rounded-full text-sm font-semibold border ${getPaymentColor(selectedPaymentStatus)}`}>
                {getPaymentLabel(selectedPaymentStatus)}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            {/* Update Status */}
            <div className="relative">
              <button 
                disabled={loading}
                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                📊 Change Status
              </button>
              {statusDropdownOpen && (
                <div className="absolute top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-max">
                  {statuses.map(status => (
                    <button
                      key={status}
                      onClick={() => handleUpdateStatus(status)}
                      disabled={loading}
                      className="block w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 disabled:opacity-50 first:rounded-t-lg last:rounded-b-lg border-b last:border-b-0 border-gray-100"
                    >
                      {getStatusLabel(status)}
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
                className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 disabled:opacity-50 transition-colors"
              >
                💰 Payment
              </button>
              {paymentDropdownOpen && (
                <div className="absolute top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-max">
                  {paymentStatuses.map(status => (
                    <button
                      key={status}
                      onClick={() => handleUpdatePaymentStatus(status)}
                      disabled={loading}
                      className="block w-full text-left px-4 py-2.5 text-sm hover:bg-amber-50 disabled:opacity-50 first:rounded-t-lg last:rounded-b-lg border-b last:border-b-0 border-gray-100"
                    >
                      {getPaymentLabel(status)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Assign/Reassign Rider */}
            <button 
              disabled={loading}
              onClick={openRiderModal}
              className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              🚴 {order.rider ? 'Reassign' : 'Assign'} Rider
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Customer & Delivery Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-xs font-semibold text-gray-600 mb-2">CUSTOMER</div>
                <div className="text-lg font-bold text-gray-900">{order.customer}</div>
                <div className="text-sm text-gray-600 mt-1">{order.phone}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-xs font-semibold text-gray-600 mb-2">RIDER</div>
                <div className="text-lg font-bold text-gray-900">{order.rider?.name || '—'}</div>
                <div className={`text-sm mt-1 ${order.rider ? 'text-green-700' : 'text-gray-600'}`}>
                  {order.rider ? '✓ Assigned' : 'Not assigned'}
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-xs font-semibold text-blue-700 mb-2">📍 DELIVERY ADDRESS</div>
              <div className="text-gray-900 font-medium">{order.address}</div>
              <div className="text-sm text-gray-600 mt-1">{order.zone}</div>
            </div>

            {/* Items */}
            <div>
              <div className="text-sm font-bold text-gray-900 mb-3">📦 ORDER ITEMS ({detailsItems.length})</div>
              {detailsLoading ? (
                <div className="py-4 text-sm text-gray-500 text-center">Loading items…</div>
              ) : detailsError ? (
                <div className="py-4 text-sm text-red-600 text-center">❌ {detailsError}</div>
              ) : detailsItems.length === 0 ? (
                <div className="py-4 text-sm text-gray-400 text-center">— No items found</div>
              ) : (
                <div className="bg-gray-50 rounded-lg divide-y">
                  {detailsItems.map((item, i) => (
                    <div key={item.id || i} className="p-3 flex items-center justify-between">
                      <span className="text-sm text-gray-700"><strong>{item.quantity}x</strong> {item.name}</span>
                      <span className="text-sm font-bold text-gray-900">
                        {(item as any).originalPrice ? (
                          <>
                            <span className="line-through text-gray-400 font-normal mr-1">GHS {(item as any).originalPrice.toLocaleString()}</span>
                            GHS {item.price.toLocaleString()}
                          </>
                        ) : (
                          `GHS ${item.price.toLocaleString()}`
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Timeline */}
            {order.timeline && order.timeline.length > 0 && (
              <div>
                <div className="text-sm font-bold text-gray-900 mb-3">⏱️ TIMELINE</div>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  {order.timeline.map((t, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{t.time}</span>
                      <span className="font-semibold text-gray-900">{t.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Info */}
            <div>
              <div className="text-sm font-bold text-gray-900 mb-3">💳 PAYMENT</div>

              {/* Failed payment banner */}
              {selectedPaymentStatus === 'failed' && (
                <div className="mb-3 flex items-center gap-2 bg-red-50 border border-red-300 rounded-lg px-4 py-3">
                  <span className="text-red-600 text-lg">❌</span>
                  <div>
                    <div className="text-sm font-bold text-red-700">Payment Failed</div>
                    <div className="text-xs text-red-600">This order's payment was not processed successfully.</div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                {/* Method */}
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-center">
                  <div className="text-xs font-semibold text-gray-500 mb-1">METHOD</div>
                  <div className="text-xl mb-0.5">
                    {order.paymentMethod === 'card' ? '💳' : order.paymentMethod === 'momo' ? '📱' : '💵'}
                  </div>
                  <div className="text-sm font-bold text-gray-900">
                    {order.paymentMethod === 'card' ? 'Card' : order.paymentMethod === 'momo' ? 'Mobile Money' : 'Cash on Delivery'}
                  </div>
                </div>

                {/* Status */}
                <div className={`p-3 rounded-lg border text-center ${
                  selectedPaymentStatus === 'paid' ? 'bg-green-50 border-green-200' :
                  selectedPaymentStatus === 'failed' ? 'bg-red-50 border-red-200' :
                  'bg-amber-50 border-amber-200'
                }`}>
                  <div className="text-xs font-semibold text-gray-500 mb-1">STATUS</div>
                  <div className="text-xl mb-0.5">
                    {selectedPaymentStatus === 'paid' ? '✅' : selectedPaymentStatus === 'failed' ? '❌' : '⏳'}
                  </div>
                  <div className={`text-sm font-bold ${
                    selectedPaymentStatus === 'paid' ? 'text-green-700' :
                    selectedPaymentStatus === 'failed' ? 'text-red-700' :
                    'text-amber-700'
                  }`}>
                    {selectedPaymentStatus === 'paid' ? 'Paid' : selectedPaymentStatus === 'failed' ? 'Failed' : 'Pending'}
                  </div>
                </div>

                {/* Amount */}
                <div className={`p-3 rounded-lg border text-center ${selectedPaymentStatus === 'paid' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="text-xs font-semibold text-gray-500 mb-1">AMOUNT</div>
                  <div className="text-sm font-bold text-gray-900 mt-3">
                    GHS {order.total?.toLocaleString() || '0'}
                  </div>
                  {selectedPaymentStatus === 'paid' && (
                    <div className="text-xs text-green-600 mt-0.5">Collected</div>
                  )}
                </div>
              </div>

              {/* Payment Reference */}
              {order.paymentRef && (
                <div className="mt-3 bg-purple-50 p-3 rounded-lg border border-purple-200">
                  <div className="text-xs font-semibold text-purple-700 mb-1">PAYMENT REFERENCE</div>
                  <div className="text-sm font-mono text-gray-900 break-all">{order.paymentRef}</div>
                </div>
              )}

              {/* Coupon / Subscription */}
              {(order.coupon || order.subscription) && (
                <div className="mt-3 bg-green-50 p-3 rounded-lg border border-green-200">
                  <div className="text-xs font-semibold text-green-700 mb-1">PROMO / SUBSCRIPTION</div>
                  <div className="text-sm text-gray-900">{order.coupon || order.subscription || '—'}</div>
                </div>
              )}
            </div>

            {/* Ratings - use fresh data from getById fetch */}
            {(riderRatingData || productReviewsData.length > 0) ? (
              <div className="space-y-4">
                {riderRatingData && (
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                    <div className="text-xs font-semibold text-amber-700 mb-2">⭐ RIDER RATING</div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{'⭐'.repeat(riderRatingData.rating)}{'☆'.repeat(5 - riderRatingData.rating)}</span>
                      <span className="text-lg font-bold text-amber-700">{riderRatingData.rating}/5</span>
                    </div>
                    {riderRatingData.comment && (
                      <div className="text-sm text-gray-700 mt-2 italic">"{riderRatingData.comment}"</div>
                    )}
                  </div>
                )}
                {productReviewsData.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-gray-700 mb-2">📝 PRODUCT REVIEWS</div>
                    <div className="space-y-2">
                      {productReviewsData.map((review, i) => (
                        <div key={i} className="bg-blue-50 p-3 rounded border border-blue-200">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-semibold text-gray-900">{review.productName}</span>
                            <span className="text-sm">{'⭐'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                          </div>
                          {review.comment && (
                            <div className="text-xs text-gray-700 italic mt-1">"{review.comment}"</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="text-xs font-semibold text-gray-500 mb-1">⭐ CUSTOMER FEEDBACK</div>
                <div className="text-sm text-gray-400">No ratings yet</div>
              </div>
            )}
          </div>
        </div>

        {/* Rider Assignment Modal */}
        {riderModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setRiderModalOpen(false)} />
            <div className="relative bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {order.rider ? 'Reassign Rider' : 'Assign Rider'}
                </h3>
                <button 
                  onClick={() => setRiderModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <span className="text-2xl font-light">×</span>
                </button>
              </div>

              {order.rider && (
                <div className="mb-4 p-3 bg-gray-100 rounded-lg">
                  <div className="text-xs text-gray-600 font-semibold mb-1">CURRENT RIDER</div>
                  <div className="text-sm font-bold text-gray-900">{order.rider.name}</div>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  SELECT RIDER
                </label>
                {ridersLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <svg className="animate-spin h-5 w-5 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="ml-2 text-sm text-gray-600">Loading riders...</span>
                  </div>
                ) : availableRiders.length === 0 ? (
                  <div className="py-6 text-center text-sm text-gray-500 bg-gray-50 rounded-lg">
                    No active riders available
                  </div>
                ) : (
                  <select
                    value={selectedRiderId || ''}
                    onChange={(e) => setSelectedRiderId(Number(e.target.value) || null)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                  >
                    <option value="">Choose a rider...</option>
                    {availableRiders.map((rider) => (
                      <option key={rider.id} value={rider.id}>
                        {rider.name} • {rider.status} • {rider.zone || 'No zone'}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setRiderModalOpen(false)}
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignRider}
                  disabled={loading || !selectedRiderId}
                  className="flex-1 px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Assigning...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetailsDrawer;
