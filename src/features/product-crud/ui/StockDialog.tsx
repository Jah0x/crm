// src/features/product-crud/ui/StockDialog.tsx
import { useState } from "react";
import { Modal, Button } from "@/shared/ui";
import { Product } from "@/entities/product";
import { useProductMutations } from "../model/useProductMutations";

interface Props { product: Product; }

export function StockDialog({ product }: Props) {
  const { stockUp } = useProductMutations();
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState(1);

  return (
    <Modal open={open} onOpenChange={setOpen}>
      <Modal.Trigger asChild>
        <Button variant="ghost" size="sm">Добавить запас</Button>
      </Modal.Trigger>
      <Modal.Content className="p-6 space-y-4">
        <h2 className="text-lg font-semibold">Пополнить запас</h2>
        <input
          type="number"
          className="border rounded-xl px-3 py-2 w-full"
          min={1}
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
        />
        <Button
          onClick={() =>
            stockUp.mutate(
              { id: product.id, qty },
              { onSuccess: () => setOpen(false) }
            )
          }
        >
          Пополнить
        </Button>
      </Modal.Content>
    </Modal>
  );
}
