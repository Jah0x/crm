// src/entities/user/ui/UserAvatar.tsx
import { User } from "../model/types";

interface Props {
  user: User;
  size?: number;
}
export function UserAvatar({ user, size = 32 }: Props) {
  return (
    <img
      src={user.avatarUrl ?? "/avatar-placeholder.svg"}
      alt={user.name}
      className="rounded-full"
      style={{ width: size, height: size }}
    />
  );
}
