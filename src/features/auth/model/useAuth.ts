// src/features/auth/model/useAuth.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/lib";

const STORAGE_KEY = "token";

export function useAuth() {
  const qc = useQueryClient();

  const login = useMutation({
    mutationFn: async (payload: { email: string; password: string }) => {
      const { data } = await apiClient.post<{ token: string }>(
        "/auth/login",
        payload
      );
      localStorage.setItem(STORAGE_KEY, data.token);
      await qc.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    qc.invalidateQueries({ queryKey: ["currentUser"] });
  };

  return { login, logout };
}
