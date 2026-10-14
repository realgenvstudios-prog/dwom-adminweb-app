export interface ProductCategory {
  id: string;
  name: string;
}

export interface ProductBundle {
  id: string;
  name: string;
}

export interface InventoryData {
  id: number;
  quantity: number;
  reorderLevel: number;
  reorderQuantity: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

export interface Product {
  id: string | number;
  nameEnglish: string;
  nameFrench?: string;
  nameLocal: string;
  categoryId: number;  // Backend field name
  category?: ProductCategory;  // Optional populated category object
  unitType: string;
  pricePerUnit: number | string;  // Can come as string from API
  imageUrl?: string;  // Added image URL
  active: boolean;
  description: string;
  discount?: number;  // Optional discount percentage (0-100)
  stockStatus?: string;  // Manual admin flag: 'in_stock' | 'low_stock' | 'out_of_stock'
  seasonal?: boolean;
  inventoryQuantity?: number;
  reorderLevel?: number;
  bundles?: ProductBundle[];
  inventory?: InventoryData | null;
}