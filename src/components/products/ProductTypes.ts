export type InventoryStatus = "In stock" | "Low" | "Out of stock";

export interface ProductCategory {
  id: string;
  name: string;
}

export interface ProductBundle {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  nameEnglish: string;
  nameLocal: string;
  category: ProductCategory | string | number;  // Can be object with id, or direct ID
  unitType: string;
  pricePerUnit: number | string;  // Can come as string from API
  imageUrl?: string;  // Added image URL
  inventoryStatus: InventoryStatus;
  active: boolean;
  description: string;
  inventoryQuantity: number;
  reorderLevel: number;
  bundles: ProductBundle[];
}