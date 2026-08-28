import adminApiClient from './apiClient';

export interface Supplier {
  id: number;
  name: string;
  contactName?: string;
  phone?: string;
  location?: string;
  notes?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  productCount?: number;
  procurementCount?: number;
}

export interface SupplierProductLink {
  id: number;
  productId: number;
  supplierId: number;
  preferred: boolean;
  active: boolean;
  Product: { id: number; nameEnglish: string; nameLocal: string; unitType: string; imageUrl?: string };
  latestCost: number | null;
  latestCostRecordedAt: string | null;
}

export interface SupplierDetail extends Supplier {
  ProductSupplier: SupplierProductLink[];
}

export interface CreateSupplierDto {
  name: string;
  contactName?: string;
  phone?: string;
  location?: string;
  notes?: string;
}

export interface UpdateSupplierDto {
  name?: string;
  contactName?: string;
  phone?: string;
  location?: string;
  notes?: string;
  active?: boolean;
}

export interface ProductSupplierOption {
  supplier: Supplier;
  preferred: boolean;
  latestCost: number | null;
  latestCostRecordedAt: string | null;
}

export const suppliersService = {
  async getAll(includeInactive = false): Promise<Supplier[]> {
    return adminApiClient.get<Supplier[]>(`/suppliers${includeInactive ? '?includeInactive=true' : ''}`);
  },

  async getById(id: number): Promise<SupplierDetail> {
    return adminApiClient.get<SupplierDetail>(`/suppliers/${id}`);
  },

  async create(dto: CreateSupplierDto): Promise<Supplier> {
    return adminApiClient.post<Supplier>('/suppliers', dto);
  },

  async update(id: number, dto: UpdateSupplierDto): Promise<Supplier> {
    return adminApiClient.patch<Supplier>(`/suppliers/${id}`, dto);
  },

  async remove(id: number): Promise<{ active?: boolean; deleted?: boolean }> {
    return adminApiClient.delete(`/suppliers/${id}`);
  },

  async linkProduct(supplierId: number, productId: number, preferred?: boolean) {
    return adminApiClient.post(`/suppliers/${supplierId}/products/${productId}`, { preferred });
  },

  async unlinkProduct(supplierId: number, productId: number) {
    return adminApiClient.delete(`/suppliers/${supplierId}/products/${productId}`);
  },

  async getSuppliersForProduct(productId: number): Promise<ProductSupplierOption[]> {
    return adminApiClient.get<ProductSupplierOption[]>(`/suppliers/products/${productId}`);
  },
};

export default suppliersService;
