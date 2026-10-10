import adminApiClient from './apiClient';
import { logger } from '../utils/logger';

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
      return await adminApiClient.get<InventoryItem[]>('/inventory');
    } catch (error) {
      logger.error('❌ [InventoryService] Failed to fetch inventory:', error);
      throw error;
    }
  }

  /**
   * Get inventory for specific product
   */
  async getByProduct(productId: number): Promise<InventoryItem> {
    try {
      return await adminApiClient.get<InventoryItem>(`/inventory/product/${productId}`);
    } catch (error) {
      logger.error(`❌ [InventoryService] Failed to fetch inventory for product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Get low stock items
   */
  async getLowStock(): Promise<InventoryItem[]> {
    try {
      return await adminApiClient.get<InventoryItem[]>('/inventory/low-stock');
    } catch (error) {
      logger.error('❌ [InventoryService] Failed to fetch low stock items:', error);
      throw error;
    }
  }

  /**
   * Get inventory stats overview
   */
  async getStats(): Promise<InventoryStats> {
    try {
      return await adminApiClient.get<InventoryStats>('/inventory/stats');
    } catch (error) {
      logger.error('❌ [InventoryService] Failed to fetch stats:', error);
      throw error;
    }
  }

  /**
   * Restock inventory for a product
   */
  async restock(productId: number, dto: RestockInventoryDto): Promise<InventoryItem> {
    try {
      return await adminApiClient.patch<InventoryItem>(`/inventory/product/${productId}/restock`, dto);
    } catch (error) {
      logger.error(`❌ [InventoryService] Failed to restock product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Record stock movement (in/out/adjustment)
   */
  async recordMovement(productId: number, dto: RecordMovementDto): Promise<MovementRecord> {
    try {
      return await adminApiClient.post<MovementRecord>(`/inventory/product/${productId}/movement`, dto);
    } catch (error) {
      logger.error(`❌ [InventoryService] Failed to record movement for product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Get movement history for a product
   */
  async getMovementHistory(productId: number, limit: number = 20): Promise<MovementRecord[]> {
    try {
      return await adminApiClient.get<MovementRecord[]>(`/inventory/product/${productId}/history?limit=${limit}`);
    } catch (error) {
      logger.error(`❌ [InventoryService] Failed to fetch movement history for product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Create new inventory item
   */
  async create(dto: CreateInventoryDto): Promise<InventoryItem> {
    try {
      return await adminApiClient.post<InventoryItem>('/inventory', dto);
    } catch (error) {
      logger.error(`❌ [InventoryService] Failed to create inventory:`, error);
      throw error;
    }
  }

  /**
   * Update reorder thresholds for a product
   */
  async updateThresholds(productId: number, reorderLevel: number, reorderQuantity: number): Promise<InventoryItem> {
    try {
      return await adminApiClient.patch<InventoryItem>(`/inventory/product/${productId}/thresholds`, { reorderLevel, reorderQuantity });
    } catch (error) {
      logger.error(`❌ [InventoryService] Failed to update thresholds for product ${productId}:`, error);
      throw error;
    }
  }
}

export default new InventoryService();
