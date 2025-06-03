// src/entities/product/model/useProductList.ts
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/lib";

export function useProductList() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data } = await apiClient.get("/products");
      return data;
    },
  });
}
