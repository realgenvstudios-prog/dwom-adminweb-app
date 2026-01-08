import adminApiClient from './apiClient';

export interface Category {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
  imageUrl?: string;
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string;
  imageUrl?: string;
}

class CategoriesService {
  /**
   * Get all categories
   */
  async getAll(): Promise<Category[]> {
    try {
      console.log('📂 [CategoriesService] Fetching all categories');
      const data = await adminApiClient.get<Category[]>('/categories');
      console.log('✅ [CategoriesService] Categories fetched:', Array.isArray(data) ? data.length : 0);
      return data || [];
    } catch (error: any) {
      console.error('❌ [CategoriesService] Failed to fetch categories:', error);
      throw error;
    }
  }

  /**
   * Get single category by ID
   */
  async getById(id: number): Promise<Category> {
    try {
      console.log(`📂 [CategoriesService] Fetching category ${id}`);
      const data = await adminApiClient.get<Category>(`/categories/${id}`);
      console.log(`✅ [CategoriesService] Category ${id} fetched`);
      return data;
    } catch (error: any) {
      console.error(`❌ [CategoriesService] Failed to fetch category ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create new category
   */
  async create(dto: CreateCategoryDto): Promise<Category> {
    try {
      console.log('📂 [CategoriesService] Creating category:', dto.name);
      const data = await adminApiClient.post<Category>('/categories', dto);
      console.log('✅ [CategoriesService] Category created:', data.id);
      return data;
    } catch (error: any) {
      console.error('❌ [CategoriesService] Failed to create category:', error);
      throw error;
    }
  }

  /**
   * Update category
   */
  async update(id: number, dto: UpdateCategoryDto): Promise<Category> {
    try {
      console.log(`📂 [CategoriesService] Updating category ${id}`);
      const data = await adminApiClient.patch<Category>(`/categories/${id}`, dto);
      console.log(`✅ [CategoriesService] Category ${id} updated`);
      return data;
    } catch (error: any) {
      console.error(`❌ [CategoriesService] Failed to update category ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete category
   */
  async delete(id: number): Promise<void> {
    try {
      console.log(`🗑️ [CategoriesService] Deleting category ${id}`);
      await adminApiClient.delete(`/categories/${id}`);

      console.log(`✅ [CategoriesService] Category ${id} deleted`);
    } catch (error: any) {
      console.error(`❌ [CategoriesService] Failed to delete category ${id}:`, error);
      throw error;
    }
  }
}

export default new CategoriesService();
