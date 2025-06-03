// src/features/auth/ui/LoginForm.tsx
import { useState } from "react";
import { Button, Card } from "@/shared/ui";
import { useAuth } from "../model/useAuth";

export function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <Card className="max-w-sm mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Вход</h1>
      <div className="flex flex-col gap-4">
        <input
          className="border rounded-xl px-3 py-2"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          className="border rounded-xl px-3 py-2"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button
          onClick={() => login.mutate({ email, password })}
          disabled={login.isPending}
        >
          {login.isPending ? "..." : "Войти"}
        </Button>
      </div>
    </Card>
  );
}
