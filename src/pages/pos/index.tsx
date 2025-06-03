// src/pages/pos/index.tsx
import { useProductList } from "@/entities/product";
import { ProductCard } from "@/entities/product";
import { CartSummary } from "@/widgets/cart-summary";

export default function POSPage() {
  const { data: products = [], isLoading } = useProductList();

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6">
      {/* список товаров */}
      <div className="flex-1 grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {isLoading && <span>Загружаю…</span>}
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      {/* корзина */}
      <CartSummary />
    </div>
  );
}
