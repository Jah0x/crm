// src/features/cart/ui/QuantityCounter.tsx
import { Button } from "@/shared/ui";
import { useCart } from "../model/useCart";

interface Props {
  productId: string;
  qty: number;
}
export function QuantityCounter({ productId, qty }: Props) {
  const { updateQty, remove } = useCart();
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() =>
          qty === 1 ? remove(productId) : updateQty(productId, qty - 1)
        }
      >
        –
      </Button>
      <span className="w-6 text-center">{qty}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => updateQty(productId, qty + 1)}
      >
        +
      </Button>
    </div>
  );
}
