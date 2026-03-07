const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://dwom-backend.onrender.com';

export interface InventoryItem {
  id: number;
  productId: number;
  productName?: string;
  productImage?: string;
  quantity: number;
  minThreshold: number;
  maxThreshold: number;
  warehouseZone?: string;
  lastRestocked?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryStats {
  totalProducts: number;
  totalUnits: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalInventoryValue: number;
}

export interface MovementRecord {
  id: number;
  productId: number;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  reason: string;
  reference?: string;
  recordedBy?: string;
  createdAt: string;
}

export interface CreateInventoryDto {
  productId: number;
  quantity: number;
  minThreshold: number;
  maxThreshold: number;
  warehouseZone?: string;
}

export interface RestockInventoryDto {
  quantity: number;
  reason?: string;
  reference?: string;
}

export interface RecordMovementDto {
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  reason: string;
  reference?: string;
}

class InventoryService {
  /**
   * Get all inventory items
   */
  async getAll(): Promise<InventoryItem[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/inventory`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch inventory: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('❌ [InventoryService] Failed to fetch inventory:', error);
      throw error;
    }
  }

  /**
   * Get inventory for specific product
   */
  async getByProduct(productId: number): Promise<InventoryItem> {
    try {
      const response = await fetch(`${API_BASE_URL}/inventory/product/${productId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch inventory: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error(`❌ [InventoryService] Failed to fetch inventory for product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Get low stock items
   */
  async getLowStock(): Promise<InventoryItem[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/inventory/low-stock`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch low stock items: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('❌ [InventoryService] Failed to fetch low stock items:', error);
      throw error;
    }
  }

  /**
   * Get inventory stats overview
   */
  async getStats(): Promise<InventoryStats> {
    try {
      const response = await fetch(`${API_BASE_URL}/inventory/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('❌ [InventoryService] Failed to fetch stats:', error);
      throw error;
    }
  }

  /**
   * Restock inventory for a product
   */
  async restock(productId: number, dto: RestockInventoryDto): Promise<InventoryItem> {
    try {
      const response = await fetch(`${API_BASE_URL}/inventory/product/${productId}/restock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify(dto),
      });

      if (!response.ok) {
        throw new Error(`Failed to restock: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error(`❌ [InventoryService] Failed to restock product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Record stock movement (in/out/adjustment)
   */
  async recordMovement(productId: number, dto: RecordMovementDto): Promise<MovementRecord> {
    try {
      const response = await fetch(`${API_BASE_URL}/inventory/product/${productId}/movement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify(dto),
      });

      if (!response.ok) {
        throw new Error(`Failed to record movement: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error(`❌ [InventoryService] Failed to record movement for product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Get movement history for a product
   */
  async getMovementHistory(productId: number, limit: number = 20): Promise<MovementRecord[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/inventory/product/${productId}/history?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch movement history: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error(`❌ [InventoryService] Failed to fetch movement history for product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Create new inventory item
   */
  async create(dto: CreateInventoryDto): Promise<InventoryItem> {
    try {
      const response = await fetch(`${API_BASE_URL}/inventory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify(dto),
      });

      if (!response.ok) {
        throw new Error(`Failed to create inventory: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error(`❌ [InventoryService] Failed to create inventory:`, error);
      throw error;
    }
  }

  /**
   * Update reorder thresholds for a product
   */
  async updateThresholds(productId: number, reorderLevel: number, reorderQuantity: number): Promise<InventoryItem> {
    try {
      const response = await fetch(`${API_BASE_URL}/inventory/product/${productId}/thresholds`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify({ reorderLevel, reorderQuantity }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update thresholds: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error(`❌ [InventoryService] Failed to update thresholds for product ${productId}:`, error);
      throw error;
    }
  }
}

export default new InventoryService();
