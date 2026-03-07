import adminApiClient from './apiClient';

export interface Product {
  id: number;
  nameEnglish: string;
  nameFrench?: string;
  nameLocal: string;
  categoryId: number;
  category?: any;
  description?: string;
  pricePerUnit: number;
  unitType: string;
  active: boolean;
  discount?: number;
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
  nameFrench?: string;
  nameLocal: string;
  categoryId: number;
  description?: string;
  pricePerUnit: number;
  unitType: string;
  imageUrl?: string;
  inventoryQuantity?: number;
  showPreparationOptions?: boolean;
  variationGroups?: any[];
}

export interface UpdateProductDto {
  nameEnglish?: string;
  nameFrench?: string;
  nameLocal?: string;
  categoryId?: number;
  description?: string;
  pricePerUnit?: number;
  unitType?: string;
  active?: boolean;
  imageUrl?: string;
  discount?: number;
  showPreparationOptions?: boolean;
  variationGroups?: any[];
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
      const params = new URLSearchParams();
      if (categoryId) params.append('categoryId', categoryId.toString());
      if (search) params.append('search', search);
      if (skip) params.append('skip', skip.toString());
      if (take) params.append('take', take.toString());

      const response = await adminApiClient.get<any>(
        `/products${params.toString() ? '?' + params.toString() : ''}`
      );
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
      const response = await adminApiClient.get<Product>(`/products/${id}`);
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
      const response = await adminApiClient.post<Product>('/products', dto);
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
      const response = await adminApiClient.patch<Product>(`/products/${id}`, dto);
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
      const response = await adminApiClient.delete(`/products/${id}`);
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
      const response = await adminApiClient.get<Category[]>('/product-categories');
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
      const response = await adminApiClient.get<Product[]>(`/products/search/${query}`);
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
      const response = await adminApiClient.get<Product[]>(`/products/category/${categoryId}`);
      return response;
    } catch (error) {
      console.error('❌ [ProductsService] Failed to fetch category products:', error);
      return [];
    }
  },
};

export default productsService;
