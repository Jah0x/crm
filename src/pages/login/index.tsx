// src/pages/login/index.tsx
import { LoginForm } from "@/features/auth";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <LoginForm />
    </div>
  );
}
