// src/features/cart/ui/AddToCartButton.tsx
import { Product } from "@/entities/product";
import { Button } from "@/shared/ui";
import { useCart } from "../model/useCart";

interface Props {
  product: Product;
}
export function AddToCartButton({ product }: Props) {
  const { add } = useCart();
  return (
    <Button
      size="sm"
      variant="primary"
      onClick={() => add(product, 1)}
      disabled={product.inStock === 0}
    >
      Добавить
    </Button>
  );
}
