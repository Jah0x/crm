// src/app/providers/Providers.tsx
import { Toaster } from "sonner";
import { ReactNode } from "react";
import { TooltipProvider } from "@/shared/ui/Tooltip";

interface Props { children: ReactNode; }

export function Providers({ children }: Props) {
  return (
    <>
      <TooltipProvider delayDuration={150}>{children}</TooltipProvider>
      <Toaster richColors position="top-right" />
    </>
  );
}
