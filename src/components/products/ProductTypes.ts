export type InventoryStatus = "In stock" | "Low" | "Out of stock";

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
  nameLocal: string;
  categoryId: number;  // Backend field name
  category?: ProductCategory;  // Optional populated category object
  unitType: string;
  pricePerUnit: number | string;  // Can come as string from API
  imageUrl?: string;  // Added image URL
  inventoryStatus: InventoryStatus;
  active: boolean;
  description: string;
  inventoryQuantity?: number;
  reorderLevel?: number;
  bundles?: ProductBundle[];
  inventory?: InventoryData | null;
}