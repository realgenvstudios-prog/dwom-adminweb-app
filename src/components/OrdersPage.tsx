import React, { useState, useEffect } from "react";
import OrdersKpiCards from "./orders/OrdersKpiCards";
import OrdersFiltersBar from "./orders/OrdersFiltersBar";
import OrdersTable from "./orders/OrdersTable";
import OrderDetailsDrawer from "./orders/OrderDetailsDrawer";
import CreateOrderModal from "./orders/CreateOrderModal";
import type { Order, OrdersFilterState, RiderSummary } from "./orders/OrderTypes";
import ordersService from "../services/ordersService";

// Get today's date in YYYY-MM-DD format
const getTodayString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const defaultFilter: OrdersFilterState = {
  dateRange: [getTodayString(), getTodayString()],
  status: "All",
  paymentStatus: "All",
  zone: "All",
  rider: "All",
  search: "",
};

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<OrdersFilterState>(defaultFilter);
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const pageSize = 10;

  // Fetch orders from backend
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('📦 [OrdersPage] Fetching orders from backend');
        const data = await ordersService.getAll();
        
        // Transform backend data to frontend format
        const transformedOrders: Order[] = Array.isArray(data) ? data.map((order: any) => ({
          id: order.id?.toString() || `DW-ORD-${order.id}`,
          time: new Date(order.createdAt).toLocaleString(),
          customer: order.User?.name || `User ${order.userId}`,
          phone: order.Address?.phone || order.User?.phoneNumber || 'N/A',
          address: order.Address?.addressText || 'N/A',
          zone: order.Address?.addressText || order.User?.region || 'N/A',
          rider: order.Rider ? { id: order.Rider.id.toString(), name: order.Rider.name } : null,
          items: [
            ...(order.OrderItem?.map((item: any) => ({
              id: item.id.toString(),
              name: item.Product?.nameEnglish || `Product ${item.productId}`,
              quantity: item.quantity,
              price: item.unitPrice || 0,
            })) || []),
            ...(order.BundleOrderItem?.map((item: any) => ({
              id: `bundle-${item.id}`,
              name: item.Bundle?.name || `Bundle ${item.bundleId}`,
              quantity: item.quantity,
              price: item.unitPrice || 0,
            })) || []),
          ],
          total: order.total || 0,
          paymentStatus: order.paymentStatus || 'Pending',
          orderStatus: order.status || 'Pending',
          source: 'App',
          paymentRef: order.paymentReference,
          coupon: order.Coupon,
          subscription: order.subscriptionId?.toString(),
          timeline: [{ status: order.status || 'Pending', time: new Date(order.createdAt).toLocaleString() }],
          riderRating: order.RiderRating?.[0] ? {
            rating: order.RiderRating[0].rating,
            comment: order.RiderRating[0].comment,
          } : null,
          productReviews: order.ProductReview?.map((review: any) => ({
            productId: review.productId,
            productName: review.Product?.nameEnglish || `Product ${review.productId}`,
            rating: review.rating,
            comment: review.comment,
          })) || [],
        })) : [];
        
        console.log('✅ [OrdersPage] Orders loaded:', transformedOrders.length);
        setOrders(transformedOrders);
      } catch (err: any) {
        console.error('❌ [OrdersPage] Failed to fetch orders:', err);
        setError(err.message || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [page]);

  // Mock data for zones and riders (replace with backend calls later)
  const mockRiders: RiderSummary[] = orders
    .filter(o => o.rider)
    .map(o => o.rider!)
    .filter((rider, idx, arr) => arr.findIndex(r => r.id === rider.id) === idx)
    .slice(0, 5);

  const mockZones = Array.from(new Set(orders.map(o => o.zone))).slice(0, 5);

  // Filter logic
  const filtered = orders.filter(o =>
    (filter.status === "All" || o.orderStatus === filter.status) &&
    (filter.paymentStatus === "All" || o.paymentStatus === filter.paymentStatus) &&
    (filter.zone === "All" || o.zone === filter.zone) &&
    (filter.rider === "All" || o.rider?.id === filter.rider) &&
    (o.customer.toLowerCase().includes(filter.search.toLowerCase()) ||
      o.id.toLowerCase().includes(filter.search.toLowerCase()) ||
      o.phone.includes(filter.search))
  );

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4">
      <div className="max-w-screen-2xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
            <div className="text-sm text-gray-500">Monitor and manage all DWOM orders</div>
          </div>
          <div className="flex gap-2 mt-3 sm:mt-0">
            <button className="px-4 py-2 rounded bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 text-sm">Export CSV</button>
            <button 
              onClick={() => setCreateModalOpen(true)}
              className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 text-sm"
            >
              Create Manual Order
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-medium">❌ {error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="ml-3 text-gray-600">Loading orders...</p>
          </div>
        )}

        {/* Content */}
        {!loading && (
          <>
            {/* Filters */}
            <OrdersFiltersBar filter={filter} onChange={f => setFilter({ ...filter, ...f })} zones={mockZones} riders={mockRiders} />
            {/* KPIs */}
            <OrdersKpiCards />
            {/* Table */}
            <OrdersTable
              orders={paged}
              onRowClick={order => { setSelectedOrder(order); setDrawerOpen(true); }}
              page={page}
              pageSize={pageSize}
              total={filtered.length}
              onPageChange={setPage}
            />
          </>
        )}

        {/* Details Drawer */}
        <OrderDetailsDrawer 
          open={drawerOpen} 
          order={selectedOrder} 
          onClose={() => setDrawerOpen(false)}
          onOrderUpdated={(updatedFields) => {
            // Update the selected order with new fields
            if (selectedOrder) {
              const updated = { ...selectedOrder, ...updatedFields };
              setSelectedOrder(updated);
              
              // Update in the orders list
              setOrders(orders.map(o => o.id === selectedOrder.id ? updated : o));
              
              console.log('✅ [OrdersPage] Order updated instantly in UI:', updated);
            }
          }}
        />

        {/* Create Order Modal */}
        <CreateOrderModal 
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onOrderCreated={() => {
            console.log('✅ [OrdersPage] New order created, refreshing list');
            setCreateModalOpen(false);
            setPage(1); // Reset to first page to see new order
          }}
        />
      </div>
    </div>
  );
};

export default OrdersPage;
