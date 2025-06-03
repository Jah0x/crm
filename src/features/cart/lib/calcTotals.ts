// src/features/cart/lib/calcTotals.ts
import { CartItem } from "../model/useCart";

export const calcTotals = (items: CartItem[]) =>
  items.reduce(
    (acc, i) => {
      acc.qty += i.qty;
      acc.amount += i.qty * i.product.price;
      return acc;
    },
    { qty: 0, amount: 0 }
  );
