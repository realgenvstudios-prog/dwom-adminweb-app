import type { VariationGroup } from '../components/products/VariationGroupsEditor';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://dwom-backend.onrender.com';

export interface BundleItem {
  id: number;
  productId: number;
  productName?: string;
  quantity: number;
  unitPrice?: number;
  totalItemPrice?: number;
  productImage?: string;
}

export interface Bundle {
  id: number;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  discount: number;
  active: boolean;
  showPreparationOptions?: boolean;
  BundleItem?: BundleItem[];
  BundleVariationGroup?: (VariationGroup & { id: number })[];
  items?: Array<{ productId: number; quantity: number }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBundleDto {
  name: string;
  description?: string;
  price: number;
  discount?: number;
  imageUrl?: string;
  items: Array<{
    productId: number;
    quantity: number;
  }>;
  showPreparationOptions?: boolean;
  variationGroups?: VariationGroup[];
}

export interface UpdateBundleDto {
  name?: string;
  description?: string;
  price?: number;
  discount?: number;
  imageUrl?: string;
  showPreparationOptions?: boolean;
  variationGroups?: VariationGroup[];
}

class BundlesService {
  /**
   * Get all bundles
   */
  async getAll(): Promise<Bundle[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/bundles?includeInactive=true`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch bundles: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('❌ [BundlesService] Failed to fetch bundles:', error);
      throw error;
    }
  }

  /**
   * Get single bundle by ID
   */
  async getById(id: number): Promise<Bundle> {
    try {
      const response = await fetch(`${API_BASE_URL}/bundles/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch bundle: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error(`❌ [BundlesService] Failed to fetch bundle ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create new bundle
   */
  async create(dto: CreateBundleDto): Promise<Bundle> {
    try {
      const response = await fetch(`${API_BASE_URL}/bundles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify(dto),
      });

      if (!response.ok) {
        throw new Error(`Failed to create bundle: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('❌ [BundlesService] Failed to create bundle:', error);
      throw error;
    }
  }

  /**
   * Update bundle
   */
  async update(id: number, dto: UpdateBundleDto): Promise<Bundle> {
    try {
      const response = await fetch(`${API_BASE_URL}/bundles/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify(dto),
      });

      if (!response.ok) {
        throw new Error(`Failed to update bundle: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error(`❌ [BundlesService] Failed to update bundle ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete bundle
   */
  async delete(id: number): Promise<{ message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/bundles/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete bundle: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error(`❌ [BundlesService] Failed to delete bundle ${id}:`, error);
      throw error;
    }
  }
}

export default new BundlesService();
