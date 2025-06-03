// src/pages/users/index.tsx
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/lib";
import { Card } from "@/shared/ui";
import { UserAvatar } from "@/entities/user";

export default function UsersPage() {
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data } = await apiClient.get("/users");
      return data;
    },
  });

  return (
    <div className="container mx-auto py-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {isLoading && <span>Загружаю…</span>}
      {users.map((u: any) => (
        <Card key={u.id} className="p-4 flex items-center gap-3">
          <UserAvatar user={u} size={40} />
          <div>
            <div className="font-medium">{u.name}</div>
            <div className="text-sm text-muted-foreground">{u.email}</div>
          </div>
        </Card>
      ))}
    </div>
  );
}
