// src/widgets/cart-summary/ui/CartSummary.tsx
import { Card, Button } from "@/shared/ui";
import { useCart, calcTotals } from "@/features/cart";

export function CartSummary() {
  const { items, clear } = useCart();
  const totals = calcTotals(items);

  return (
    <Card className="p-4 flex flex-col gap-4 w-80">
      <h2 className="text-lg font-semibold">Корзина</h2>

      <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-2">
        {items.map((i) => (
          <div key={i.product.id} className="flex justify-between text-sm">
            <span>
              {i.qty} × {i.product.name}
            </span>
            <span>{i.qty * i.product.price}€</span>
          </div>
        ))}
        {items.length === 0 && (
          <span className="text-muted-foreground text-sm">Пусто</span>
        )}
      </div>

      <div className="mt-auto font-medium flex justify-between">
        <span>Итого:</span>
        <span>{totals.amount}€</span>
      </div>

      <Button variant="primary" disabled={items.length === 0}>
        Оплатить
      </Button>
      <Button variant="ghost" onClick={clear} disabled={items.length === 0}>
        Очистить
      </Button>
    </Card>
  );
}
