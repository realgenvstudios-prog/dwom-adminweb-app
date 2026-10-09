import { useEffect, useRef, useState } from "react";
import apiClient from "../../services/apiClient";
import type { Customer } from "./CustomerTypes";

// Fetches the customer list (with stats). Split out of the former
// monolithic CustomersPage.
export function useCustomersData() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef(false);

  const fetchCustomers = async () => {
    if (isFetchingRef.current) return;

    try {
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);

      console.log('📊 [CustomersPage] Fetching customers with stats...');

      const data = await apiClient.get<any[]>('/users/admin/customers');
      console.log('📊 [CustomersPage] Response:', data);

      if (!Array.isArray(data)) {
        console.error('❌ [CustomersPage] Expected array, got:', typeof data);
        setError('Invalid response from server');
        setCustomers([]);
        return;
      }

      const mappedCustomers: Customer[] = data.map(user => ({
        id: user.id,
        name: user.name || 'Unknown',
        email: user.email || null,
        phone: user.phone || user.phoneNumber || 'N/A',
        role: user.role,
        createdAt: user.createdAt,
        address: user.address || null,
        totalOrders: user.totalOrders || 0,
        totalSpend: user.totalSpend || 0,
        avgOrder: user.avgOrder || 0,
        lastOrder: user.lastOrder || null,
        status: user.status || 'New',
      }));

      console.log(`✅ [CustomersPage] Fetched ${mappedCustomers.length} customers`);
      setCustomers(mappedCustomers);
    } catch (err: any) {
      console.error('❌ [CustomersPage] Error:', err);
      setError(err.message || 'Failed to fetch customers');
      setCustomers([]);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  return { customers, loading, error, fetchCustomers };
}
