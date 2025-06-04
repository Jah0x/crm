import React, { ReactNode, useContext, createContext } from "react";
import ReactDOM from "react-dom";
import { cn } from "@/shared/lib";

type ModalContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const ModalContext = createContext<ModalContextValue | null>(null);

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

export function Modal({ open, onOpenChange, children }: ModalProps) {
  return (
    <ModalContext.Provider value={{ open, setOpen: onOpenChange }}>
      {children}
    </ModalContext.Provider>
  );
}

interface TriggerProps {
  asChild?: boolean;
  children: React.ReactElement;
}
Modal.Trigger = function ModalTrigger({ asChild, children }: TriggerProps) {
  const ctx = useContext(ModalContext)!;
  const props = { onClick: () => ctx.setOpen(true) };
  return asChild ? React.cloneElement(children, props) : <button {...props}>{children}</button>;
};

interface ContentProps {
  className?: string;
  children: ReactNode;
}
Modal.Content = function ModalContent({ className, children }: ContentProps) {
  const ctx = useContext(ModalContext)!;
  if (!ctx.open) return null;
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className={cn("bg-white rounded-xl relative", className)}>
        {children}
        <button className="absolute top-2 right-2" onClick={() => ctx.setOpen(false)}>
          ×
        </button>
      </div>
    </div>,
    document.body
  );
};
