const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://dwom-backend.onrender.com';

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
      const response = await fetch(`${API_BASE_URL}/categories`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ [CategoriesService] Categories fetched:', data.length);
      return data;
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
      const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch category: ${response.status}`);
      }

      const data = await response.json();
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
      const response = await fetch(`${API_BASE_URL}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify(dto),
      });

      if (!response.ok) {
        throw new Error(`Failed to create category: ${response.status}`);
      }

      const data = await response.json();
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
      const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify(dto),
      });

      if (!response.ok) {
        throw new Error(`Failed to update category: ${response.status}`);
      }

      const data = await response.json();
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
      const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete category: ${response.status}`);
      }

      console.log(`✅ [CategoriesService] Category ${id} deleted`);
    } catch (error: any) {
      console.error(`❌ [CategoriesService] Failed to delete category ${id}:`, error);
      throw error;
    }
  }
}

export default new CategoriesService();
