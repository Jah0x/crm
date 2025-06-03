// src/shared/ui/Card.tsx
import { cn } from "@/shared/lib/utils";
import { ReactNode } from "react";

interface CardProps {
  className?: string;
  children: ReactNode;
}
export function Card({ className, children }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-card text-card-foreground shadow",
        className
      )}
    >
      {children}
    </div>
  );
}
