export interface Product {
  id: string | number;
  nameEnglish: string;
  nameLocal: string;
  pricePerUnit: number | string;
  discount?: number;  // Optional discount percentage (0-100)
  [key: string]: any;
}

export interface Bundle {
  id: number;
  name: string;
  description?: string;
  discountPercentage?: number;
  products?: Product[];
  createdAt?: string;
  updatedAt?: string;
}
