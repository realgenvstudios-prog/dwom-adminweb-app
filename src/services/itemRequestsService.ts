import adminApiClient from './apiClient';

export type RequestStatus = 'open' | 'checking' | 'available' | 'unavailable';

/** Requests for the same item, grouped (GET /admin/item-requests). */
export interface ItemRequestGroup {
  key: string;
  text: string;
  status: RequestStatus;
  requests: number;
  customers: number;
  guests: number;
  fromSearch: number;
  fromCart: number;
  /** Signed-in customers who'll be told when it's marked available. */
  waiting: number;
  firstAt: string;
  lastAt: string;
  product: { id: number; nameEnglish: string } | null;
}

export interface ItemRequestList {
  counts: Record<RequestStatus, number>;
  groups: ItemRequestGroup[];
}

class ItemRequestsService {
  list(status?: RequestStatus): Promise<ItemRequestList> {
    return adminApiClient.get<ItemRequestList>(`/admin/item-requests${status ? `?status=${status}` : ''}`);
  }

  /** Marking one available with a product tells every customer who asked. */
  update(key: string, status: RequestStatus, productId?: number): Promise<{ key: string; status: RequestStatus; notified: number }> {
    return adminApiClient.post('/admin/item-requests/update', { key, status, productId });
  }
}

export default new ItemRequestsService();
