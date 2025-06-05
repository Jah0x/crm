import { useQuery } from "@tanstack/react-query";
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/shared/lib";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /**
   * Массив ролей, которым разрешён доступ к маршруту.
   * Если не передан, доступен любому аутентифицированному пользователю.
   */
  allowedRoles?: string[];
}

/**
 * Глобальный хелпер для защиты маршрутов.
 * Если пользователь не залогинен → редирект на /login;
 * если роль не входит в allowedRoles → редирект на /.
 */
export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { data: user, isLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const { data } = await apiClient.get("/auth/me");
      return data;
    },
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    } else if (user && allowedRoles && !allowedRoles.includes(user.role)) {
      navigate("/");
    }
  }, [user, isLoading, navigate, allowedRoles]);

  // Глобальный лоадер (можно заменить на компонент Spinner)
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Загрузка пользователя…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;
  if (allowedRoles && !allowedRoles.includes(user.role)) return null;

  return <>{children}</>;
}
