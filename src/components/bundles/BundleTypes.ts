export interface Product {
  id: string | number;
  nameEnglish: string;
  nameLocal: string;
  pricePerUnit: number | string;
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
