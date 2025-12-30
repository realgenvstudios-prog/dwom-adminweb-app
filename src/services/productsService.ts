import adminApiClient from './apiClient';

export interface Product {
  id: number;
  nameEnglish: string;
  nameLocal: string;
  categoryId: number;
  category?: any;
  description?: string;
  pricePerUnit: number;
  unitType: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface CreateProductDto {
  nameEnglish: string;
  nameLocal: string;
  categoryId: number;
  description?: string;
  pricePerUnit: number;
  unitType: string;
  imageUrl?: string;
}

export interface UpdateProductDto {
  nameEnglish?: string;
  nameLocal?: string;
  categoryId?: number;
  description?: string;
  pricePerUnit?: number;
  unitType?: string;
  active?: boolean;
  imageUrl?: string;
}

export const productsService = {
  /**
   * Get all products with optional filtering
   */
  async getAll(
    categoryId?: number,
    search?: string,
    skip?: number,
    take?: number
  ): Promise<any> {
    try {
      console.log('📦 [ProductsService] Fetching products');
      const params = new URLSearchParams();
      if (categoryId) params.append('categoryId', categoryId.toString());
      if (search) params.append('search', search);
      if (skip) params.append('skip', skip.toString());
      if (take) params.append('take', take.toString());

      const response = await adminApiClient.get<any>(
        `/products${params.toString() ? '?' + params.toString() : ''}`
      );
      console.log('✅ [ProductsService] Products fetched:', Array.isArray(response) ? response.length : 0);
      return response;
    } catch (error) {
      console.error('❌ [ProductsService] Failed to fetch products:', error);
      throw error;
    }
  },

  /**
   * Get single product by ID
   */
  async getById(id: number): Promise<Product> {
    try {
      console.log(`📦 [ProductsService] Fetching product ${id}`);
      const response = await adminApiClient.get<Product>(`/products/${id}`);
      console.log(`✅ [ProductsService] Product ${id} fetched`);
      return response;
    } catch (error) {
      console.error(`❌ [ProductsService] Failed to fetch product ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create new product
   */
  async create(dto: CreateProductDto): Promise<Product> {
    try {
      console.log('📦 [ProductsService] Creating product:', dto.nameEnglish);
      const response = await adminApiClient.post<Product>('/products', dto);
      console.log('✅ [ProductsService] Product created:', response.id);
      return response;
    } catch (error) {
      console.error('❌ [ProductsService] Failed to create product:', error);
      throw error;
    }
  },

  /**
   * Update product
   */
  async update(id: number, dto: UpdateProductDto): Promise<Product> {
    try {
      console.log(`📦 [ProductsService] Updating product ${id}`);
      const response = await adminApiClient.patch<Product>(`/products/${id}`, dto);
      console.log(`✅ [ProductsService] Product ${id} updated`);
      return response;
    } catch (error) {
      console.error(`❌ [ProductsService] Failed to update product ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete product
   */
  async delete(id: number): Promise<any> {
    try {
      console.log(`📦 [ProductsService] Deleting product ${id}`);
      const response = await adminApiClient.delete(`/products/${id}`);
      console.log(`✅ [ProductsService] Product ${id} deleted`);
      return response;
    } catch (error) {
      console.error(`❌ [ProductsService] Failed to delete product ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get all categories
   */
  async getCategories(): Promise<Category[]> {
    try {
      console.log('📋 [ProductsService] Fetching categories');
      const response = await adminApiClient.get<Category[]>('/product-categories');
      console.log('✅ [ProductsService] Categories fetched:', response.length);
      return response;
    } catch (error) {
      console.error('❌ [ProductsService] Failed to fetch categories:', error);
      return [];
    }
  },

  /**
   * Search products
   */
  async search(query: string): Promise<Product[]> {
    try {
      console.log('🔍 [ProductsService] Searching products:', query);
      const response = await adminApiClient.get<Product[]>(`/products/search/${query}`);
      console.log('✅ [ProductsService] Search returned:', response.length);
      return response;
    } catch (error) {
      console.error('❌ [ProductsService] Failed to search products:', error);
      return [];
    }
  },

  /**
   * Get products by category
   */
  async getByCategory(categoryId: number): Promise<Product[]> {
    try {
      console.log(`📦 [ProductsService] Fetching products for category ${categoryId}`);
      const response = await adminApiClient.get<Product[]>(`/products/category/${categoryId}`);
      console.log('✅ [ProductsService] Category products fetched:', response.length);
      return response;
    } catch (error) {
      console.error('❌ [ProductsService] Failed to fetch category products:', error);
      return [];
    }
  },
};

export default productsService;
