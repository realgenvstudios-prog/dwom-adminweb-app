import adminApiClient from './apiClient';
import type { VariationGroup, VariationOption } from '../components/products/VariationGroupsEditor';
import { logger } from '../utils/logger';

// Both VariationGroup and VariationOption are create/edit-flow types with no
// `id` (a group/option being authored doesn't have one yet). The product's
// own, already-saved variations do. Using `interface extends` here rather
// than an `&` intersection — two types that both declare `options` as an
// array don't merge into the narrower element type through an intersection,
// which is exactly what broke this file's build (TS2339: Property 'id' does
// not exist on type 'VariationOption').
export interface BundleItemVariationOption extends VariationOption {
  id: number;
}

export interface BundleItemVariationGroup extends Omit<VariationGroup, 'options'> {
  id: number;
  options: BundleItemVariationOption[];
}

export interface BundleItem {
  id: number;
  productId: number;
  productName?: string;
  quantity: number;
  unitPrice?: number;
  totalItemPrice?: number;
  productImage?: string;
  // The product's OWN variation groups (not bundle-specific), returned so the
  // admin can see what's available to toggle for this item.
  variationGroups?: BundleItemVariationGroup[];
  visibleVariationOptionIds?: number[];
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
  items?: Array<{ productId: number; quantity: number; visibleVariationOptionIds?: number[] }>;
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
    visibleVariationOptionIds?: number[];
  }>;
}

export interface UpdateBundleDto {
  name?: string;
  description?: string;
  price?: number;
  discount?: number;
  imageUrl?: string;
  items?: Array<{
    productId: number;
    quantity: number;
    visibleVariationOptionIds?: number[];
  }>;
}

class BundlesService {
  /**
   * Get all bundles
   */
  async getAll(): Promise<Bundle[]> {
    try {
      return await adminApiClient.get<Bundle[]>('/bundles?includeInactive=true');
    } catch (error) {
      logger.error('❌ [BundlesService] Failed to fetch bundles:', error);
      throw error;
    }
  }

  /**
   * Get single bundle by ID
   */
  async getById(id: number): Promise<Bundle> {
    try {
      return await adminApiClient.get<Bundle>(`/bundles/${id}`);
    } catch (error) {
      logger.error(`❌ [BundlesService] Failed to fetch bundle ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create new bundle
   */
  async create(dto: CreateBundleDto): Promise<Bundle> {
    try {
      return await adminApiClient.post<Bundle>('/bundles', dto);
    } catch (error) {
      logger.error('❌ [BundlesService] Failed to create bundle:', error);
      throw error;
    }
  }

  /**
   * Update bundle
   */
  async update(id: number, dto: UpdateBundleDto): Promise<Bundle> {
    try {
      return await adminApiClient.patch<Bundle>(`/bundles/${id}`, dto);
    } catch (error) {
      logger.error(`❌ [BundlesService] Failed to update bundle ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete bundle
   */
  /** Turns a deactivated bundle back on (or off) — PATCH /bundles/:id/toggle-status. */
  async setActive(id: number, active: boolean): Promise<Bundle> {
    return adminApiClient.patch<Bundle>(`/bundles/${id}/toggle-status`, { active });
  }

  async delete(id: number): Promise<{ message: string }> {
    try {
      return await adminApiClient.delete<{ message: string }>(`/bundles/${id}`);
    } catch (error) {
      logger.error(`❌ [BundlesService] Failed to delete bundle ${id}:`, error);
      throw error;
    }
  }
}

export default new BundlesService();
