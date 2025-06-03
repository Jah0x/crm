// src/entities/product/model/types.ts
export interface Product {
  id: string;
  name: string;
  price: number;
  sku: string;
  categoryId: string | null;
  imageUrl?: string;
  inStock: number;
  lowStockThreshold: number;
}
