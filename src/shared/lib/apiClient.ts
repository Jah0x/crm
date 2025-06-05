import { Product } from "@/entities/product";
import { User } from "@/entities/user";

let products: Product[] = [
  { id: "1", name: "Товар 1", price: 100, sku: "SKU1", categoryId: null, imageUrl: undefined, inStock: 5, lowStockThreshold: 1 },
  { id: "2", name: "Товар 2", price: 200, sku: "SKU2", categoryId: null, imageUrl: undefined, inStock: 3, lowStockThreshold: 1 },
];

let users: User[] = [
  { id: "1", name: "Администратор", email: "admin@example.com", role: "admin" },
  { id: "2", name: "Кассир", email: "cashier@example.com", role: "cashier" },
];

let currentUser: User | null = users[0];

export const apiClient = {
  async get(url: string) {
    if (url === "/products") {
      return { data: products };
    }
    if (url === "/users") {
      return { data: users };
    }
    if (url === "/auth/me") {
      return { data: currentUser };
    }
    throw new Error(`GET ${url} not implemented`);
  },

  async post(url: string, payload: Record<string, unknown>) {
    if (url === "/auth/login") {
      // simple auth imitation
      const user = users.find((u) => u.email === payload.email);
      if (!user) throw new Error("Invalid credentials");
      currentUser = user;
      return { data: { token: "dummy" } };
    }
    if (url === "/products") {
      const newProduct: Product = {
        id: String(Date.now()),
        inStock: 0,
        lowStockThreshold: 1,
        sku: "",
        categoryId: null,
        imageUrl: undefined,
        ...payload,
      };
      products.push(newProduct);
      return { data: newProduct };
    }
    const stockMatch = url.match(/\/products\/(.*)\/stock/);
    if (stockMatch) {
      const prod = products.find((p) => p.id === stockMatch[1]);
      if (!prod) throw new Error("Product not found");
      prod.inStock += payload.qty ?? 0;
      return { data: prod };
    }
    throw new Error(`POST ${url} not implemented`);
  },

  async put(url: string, payload: Record<string, unknown>) {
    const match = url.match(/\/products\/(.*)/);
    if (match) {
      const prod = products.find((p) => p.id === match[1]);
      if (!prod) throw new Error("Product not found");
      Object.assign(prod, payload);
      return { data: prod };
    }
    throw new Error(`PUT ${url} not implemented`);
  },
};
