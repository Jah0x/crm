// src/pages/products/index.tsx
import { useProductList } from "@/entities/product";
import { ProductCard } from "@/entities/product";
import {
  AddProductDialog,
  EditProductDialog,
  StockDialog,
} from "@/features/product-crud";

export default function ProductsPage() {
  const { data: products = [], isLoading } = useProductList();

  return (
    <div className="container mx-auto py-6 flex flex-col gap-6">
      <div className="flex justify-end">
        <AddProductDialog />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {isLoading && <span>Загружаю…</span>}
        {products.map((p) => (
          <div key={p.id} className="flex flex-col gap-2">
            <ProductCard product={p} />
            <div className="flex gap-2">
              <EditProductDialog product={p} />
              <StockDialog product={p} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
