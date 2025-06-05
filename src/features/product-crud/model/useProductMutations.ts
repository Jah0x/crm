// src/features/product-crud/model/useProductMutations.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/lib";

export function useProductMutations() {
  const qc = useQueryClient();

  const addProduct = useMutation({
    mutationFn: (dto: Record<string, unknown>) =>
      apiClient.post("/products", dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });

  const updateProduct = useMutation({
    mutationFn: ({ id, ...dto }: Record<string, unknown> & { id: string }) =>
      apiClient.put(`/products/${id}`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });

  const stockUp = useMutation({
    mutationFn: ({ id, qty }: { id: string; qty: number }) =>
      apiClient.post(`/products/${id}/stock`, { qty }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });

  return { addProduct, updateProduct, stockUp };
}
