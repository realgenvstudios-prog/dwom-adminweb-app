import type { Customer, CustomerOrder } from "./CustomerTypes";
import { statusColors } from "./CustomerTypes";
import CustomerInfoTab from "./CustomerInfoTab";
import CustomerOrderHistoryTab from "./CustomerOrderHistoryTab";

interface CustomerDetailSidebarProps {
  selectedCustomer: Customer | null;
  detailTab: 'info' | 'orders';
  setDetailTab: (tab: 'info' | 'orders') => void;
  orderHistory: CustomerOrder[];
  orderHistoryLoading: boolean;
  expandedOrderId: number | null;
  setExpandedOrderId: (id: number | null) => void;
}

// The customer detail sidebar: profile header, Info/Orders tab switcher,
// and whichever tab is active. Split out of the former monolithic
// CustomersPage.
export default function CustomerDetailSidebar({
  selectedCustomer,
  detailTab,
  setDetailTab,
  orderHistory,
  orderHistoryLoading,
  expandedOrderId,
  setExpandedOrderId,
}: CustomerDetailSidebarProps) {
  if (!selectedCustomer) {
    return (
      <div className="p-6 text-center py-16">
        <div className="text-gray-300 text-5xl mb-4">👤</div>
        <p className="text-gray-500 text-sm">Select a customer to view their details</p>
      </div>
    );
  }

  return (
    <>
      {/* Profile Header */}
      <div className="p-6 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
            {selectedCustomer.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h4 className="text-lg font-bold text-gray-900 truncate">{selectedCustomer.name}</h4>
            <p className="text-sm text-gray-500 truncate">{selectedCustomer.phone}</p>
            <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[selectedCustomer.status]}`}>
              {selectedCustomer.status}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        <button
          onClick={() => setDetailTab('info')}
          className={`flex-1 py-3 text-sm font-medium transition ${detailTab === 'info' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Info & Stats
        </button>
        <button
          onClick={() => setDetailTab('orders')}
          className={`flex-1 py-3 text-sm font-medium transition ${detailTab === 'orders' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Order History {selectedCustomer.totalOrders > 0 && <span className="ml-1 bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">{selectedCustomer.totalOrders}</span>}
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-6 max-h-[60vh] overflow-y-auto">
        {detailTab === 'info' && <CustomerInfoTab customer={selectedCustomer} />}
        {detailTab === 'orders' && (
          <CustomerOrderHistoryTab
            orderHistoryLoading={orderHistoryLoading}
            orderHistory={orderHistory}
            expandedOrderId={expandedOrderId}
            setExpandedOrderId={setExpandedOrderId}
          />
        )}
      </div>
    </>
  );
}
