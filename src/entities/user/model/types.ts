// src/entities/user/model/types.ts
export type Role = "admin" | "cashier" | "manager";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl?: string;
}
