// src/entities/product/ui/ProductCard.tsx
import { Product } from "../model/types";
import { Card, Button } from "@/shared/ui";
import { formatMoney } from "@/shared/lib";
import { useCart } from "@/features/cart";

interface Props {
  product: Product;
}
export function ProductCard({ product }: Props) {
  const { add } = useCart();
  return (
    <Card className="p-4 flex flex-col gap-2 hover:shadow-md transition">
      <img
        src={product.imageUrl ?? "/placeholder.png"}
        alt={product.name}
        className="h-32 w-full object-cover rounded-xl"
      />
      <div className="text-sm font-medium line-clamp-2">{product.name}</div>
      <div className="mt-auto font-semibold">{formatMoney(product.price)}</div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => add(product, 1)}
        disabled={product.inStock === 0}
      >
        {product.inStock === 0 ? "Нет в наличии" : "В корзину"}
      </Button>
    </Card>
  );
}
