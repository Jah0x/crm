// src/entities/user/model/useCurrentUser.ts
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/lib";

export function useCurrentUser() {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const { data } = await apiClient.get("/auth/me");
      return data;
    },
  });
}
