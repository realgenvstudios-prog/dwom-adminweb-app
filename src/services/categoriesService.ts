import adminApiClient from './apiClient';
import { logger } from '../utils/logger';

export interface Category {
  id: number;
  name: string;
  nameFrench?: string;
  description?: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCategoryDto {
  name: string;
  nameFrench?: string;
  description?: string;
  imageUrl?: string;
}

export interface UpdateCategoryDto {
  name?: string;
  nameFrench?: string;
  description?: string;
  imageUrl?: string;
}

class CategoriesService {
  /**
   * Get all categories
   */
  async getAll(): Promise<Category[]> {
    try {
      return await adminApiClient.get<Category[]>('/categories');
    } catch (error) {
      logger.error('❌ [CategoriesService] Failed to fetch categories:', error);
      throw error;
    }
  }

  /**
   * Get single category by ID
   */
  async getById(id: number): Promise<Category> {
    try {
      return await adminApiClient.get<Category>(`/categories/${id}`);
    } catch (error) {
      logger.error(`❌ [CategoriesService] Failed to fetch category ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create new category
   */
  async create(dto: CreateCategoryDto): Promise<Category> {
    try {
      return await adminApiClient.post<Category>('/categories', dto);
    } catch (error) {
      logger.error('❌ [CategoriesService] Failed to create category:', error);
      throw error;
    }
  }

  /**
   * Update category
   */
  async update(id: number, dto: UpdateCategoryDto): Promise<Category> {
    try {
      return await adminApiClient.patch<Category>(`/categories/${id}`, dto);
    } catch (error) {
      logger.error(`❌ [CategoriesService] Failed to update category ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete category
   */
  async delete(id: number): Promise<void> {
    try {
      await adminApiClient.delete(`/categories/${id}`);
    } catch (error) {
      logger.error(`❌ [CategoriesService] Failed to delete category ${id}:`, error);
      throw error;
    }
  }
}

export default new CategoriesService();
