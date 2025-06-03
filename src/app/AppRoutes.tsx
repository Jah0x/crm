// src/app/AppRouter.tsx
import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

const DashboardPage = lazy(() => import("@/pages/dashboard"));
const POSPage        = lazy(() => import("@/pages/pos"));
const LoginPage      = lazy(() => import("@/pages/login"));

export function AppRouter() {
  return (
    <Suspense fallback={<div className="p-4 text-center">Loading…</div>}>
      <Routes>
        <Route path="/"         element={<DashboardPage />} />
        <Route path="/pos/*"    element={<POSPage />} />
        <Route path="/login"    element={<LoginPage />} />
        <Route path="*"         element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
