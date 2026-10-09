import { useState } from "react";
import apiClient from "../../services/apiClient";
import type { Customer, CustomerOrder } from "./CustomerTypes";

// The selected-customer detail panel: order history fetch, tab state,
// and the expanded-order toggle. Split out of the former monolithic
// CustomersPage.
export function useCustomerSelection() {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [orderHistory, setOrderHistory] = useState<CustomerOrder[]>([]);
  const [orderHistoryLoading, setOrderHistoryLoading] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [detailTab, setDetailTab] = useState<'info' | 'orders'>('info');

  const fetchOrderHistory = async (customerId: number) => {
    try {
      setOrderHistoryLoading(true);
      const data = await apiClient.get<CustomerOrder[]>(`/users/admin/customers/${customerId}/orders`);
      setOrderHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch order history:', err);
      setOrderHistory([]);
    } finally {
      setOrderHistoryLoading(false);
    }
  };

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDetailTab('info');
    setExpandedOrderId(null);
    setOrderHistory([]);
    fetchOrderHistory(customer.id);
  };

  return {
    selectedCustomer,
    orderHistory,
    orderHistoryLoading,
    expandedOrderId,
    setExpandedOrderId,
    detailTab,
    setDetailTab,
    selectCustomer,
  };
}
