// src/features/cart/model/useCart.ts
import { create } from "zustand";
import { Product } from "@/entities/product";

export interface CartItem {
  product: Product;
  qty: number;
}

interface State {
  items: CartItem[];
  add: (product: Product, qty: number) => void;
  remove: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clear: () => void;
}

export const useCart = create<State>((set) => ({
  items: [],
  add: (product, qty) =>
    set((state) => {
      const idx = state.items.findIndex((i) => i.product.id === product.id);
      if (idx === -1) {
        return { items: [...state.items, { product, qty }] };
      }
      const items = [...state.items];
      items[idx].qty += qty;
      return { items };
    }),
  remove: (productId) =>
    set((state) => ({
      items: state.items.filter((i) => i.product.id !== productId),
    })),
  updateQty: (productId, qty) =>
    set((state) => {
      const items = state.items.map((i) =>
        i.product.id === productId ? { ...i, qty } : i
      );
      return { items };
    }),
  clear: () => set({ items: [] }),
}));
