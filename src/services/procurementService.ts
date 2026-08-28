import adminApiClient from './apiClient';

export interface ProcurementRecord {
  id: number;
  productId: number;
  supplierId: number;
  orderId?: number | null;
  quantity: number;
  unitCost: number;
  totalCost: number;
  purchasedAt: string;
  purchasedBy?: string;
  notes?: string;
  Product: { id: number; nameEnglish: string; nameLocal: string; unitType: string };
  Supplier: { id: number; name: string };
}

export interface CreateProcurementDto {
  productId: number;
  supplierId: number;
  orderId?: number;
  quantity: number;
  unitCost: number;
  purchasedBy?: string;
  notes?: string;
}

export interface PriceHistoryEntry {
  id: number;
  productId: number;
  supplierId: number;
  cost: number;
  source: string;
  recordedAt: string;
  Supplier: { id: number; name: string };
}

export const procurementService = {
  async recordPurchase(dto: CreateProcurementDto): Promise<{ procurement: ProcurementRecord; inventory: any }> {
    return adminApiClient.post('/procurement', dto);
  },

  async getAll(filters?: { productId?: number; supplierId?: number; take?: number; skip?: number }): Promise<{ items: ProcurementRecord[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.productId) params.append('productId', String(filters.productId));
    if (filters?.supplierId) params.append('supplierId', String(filters.supplierId));
    if (filters?.take) params.append('take', String(filters.take));
    if (filters?.skip) params.append('skip', String(filters.skip));
    const qs = params.toString();
    return adminApiClient.get(`/procurement${qs ? `?${qs}` : ''}`);
  },

  async getPriceHistory(productId: number): Promise<PriceHistoryEntry[]> {
    return adminApiClient.get(`/procurement/price-history/${productId}`);
  },
};

export default procurementService;
