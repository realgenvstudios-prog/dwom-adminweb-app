import { useEffect, useState } from 'react';
import apiClient from '../../services/apiClient';
import { logger } from '../../utils/logger';

export interface DirectoryCustomer {
  id: number;
  name: string;
  phone: string;
}

type Raw = { id: number; name?: string | null; phone?: string | null; phoneNumber?: string | null };

let cache: Promise<DirectoryCustomer[]> | null = null;

/** Every customer who can be messaged (deleted accounts left out). Loaded once per page visit. */
export function loadCustomerDirectory(): Promise<DirectoryCustomer[]> {
  cache ??= apiClient
    .get<Raw[]>('/users/admin/customers')
    .then((rows) =>
      (Array.isArray(rows) ? rows : [])
        .map((u) => ({ id: u.id, name: u.name?.trim() || 'Unnamed customer', phone: u.phone || u.phoneNumber || '' }))
        .filter((c) => !c.phone.startsWith('deleted-'))
        .sort((a, b) => a.name.localeCompare(b.name)),
    )
    .catch((err) => {
      cache = null;
      throw err;
    });
  return cache;
}

export function useCustomerDirectory() {
  const [customers, setCustomers] = useState<DirectoryCustomer[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    loadCustomerDirectory()
      .then((c) => !cancelled && setCustomers(c))
      .catch((err) => {
        logger.error('Failed to load customers:', err);
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return { customers, failed };
}
