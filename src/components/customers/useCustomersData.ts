import { useCallback, useEffect, useState } from 'react';
import apiClient from '../../services/apiClient';
import { logger } from '../../utils/logger';
import type { Customer } from './CustomerTypes';

type RawCustomer = Partial<Customer> & { id: number; phoneNumber?: string };

export function useCustomersData() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await apiClient.get<RawCustomer[]>('/users/admin/customers');
      if (!Array.isArray(data)) throw new Error('Unexpected response from the server');
      setCustomers(
        data.map((u) => ({
          id: u.id,
          name: u.name || 'Unnamed customer',
          email: u.email || null,
          phone: u.phone || u.phoneNumber || '',
          createdAt: u.createdAt ?? '',
          address: u.address || null,
          addressPlace: (u as { addressPlace?: Customer['addressPlace'] }).addressPlace ?? null,
          totalOrders: u.totalOrders ?? 0,
          totalSpend: u.totalSpend ?? 0,
          lastOrder: u.lastOrder || null,
          status: u.status ?? 'New',
        })),
      );
    } catch (err) {
      logger.error('❌ [CustomersPage] Failed to fetch customers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  return { customers, loading, error, refresh: load };
}
