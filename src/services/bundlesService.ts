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
  BundleItem?: BundleItem[];
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
}

export interface UpdateBundleDto {
  name?: string;
  description?: string;
  price?: number;
  discount?: number;
  imageUrl?: string;
}

class BundlesService {
  /**
   * Get all bundles
   */
  async getAll(): Promise<Bundle[]> {
    try {
      console.log('📦 [BundlesService] Fetching all bundles');
      const response = await fetch(`${API_BASE_URL}/bundles?includeInactive=true`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch bundles: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ [BundlesService] Bundles fetched:', data.length);
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
      console.log(`📦 [BundlesService] Fetching bundle ${id}`);
      const response = await fetch(`${API_BASE_URL}/bundles/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch bundle: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ [BundlesService] Bundle ${id} fetched`);
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
      console.log('📦 [BundlesService] Creating bundle:', dto.name);
      const response = await fetch(`${API_BASE_URL}/bundles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify(dto),
      });

      if (!response.ok) {
        throw new Error(`Failed to create bundle: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ [BundlesService] Bundle created:', data.id);
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
      console.log(`📦 [BundlesService] Updating bundle ${id}`);
      const response = await fetch(`${API_BASE_URL}/bundles/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify(dto),
      });

      if (!response.ok) {
        throw new Error(`Failed to update bundle: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ [BundlesService] Bundle ${id} updated`);
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
      console.log(`🗑️ [BundlesService] Deleting bundle ${id}`);
      const response = await fetch(`${API_BASE_URL}/bundles/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete bundle: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ [BundlesService] Bundle ${id}:`, data.message);
      return data;
    } catch (error: any) {
      console.error(`❌ [BundlesService] Failed to delete bundle ${id}:`, error);
      throw error;
    }
  }
}

export default new BundlesService();
