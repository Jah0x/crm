// src/features/product-crud/ui/AddProductDialog.tsx
import { useState } from "react";
import { Modal, Button } from "@/shared/ui";
import { useProductMutations } from "../model/useProductMutations";

export function AddProductDialog() {
  const { addProduct } = useProductMutations();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState(0);

  return (
    <Modal open={open} onOpenChange={setOpen}>
      <Modal.Trigger asChild>
        <Button variant="primary">Новый товар</Button>
      </Modal.Trigger>
      <Modal.Content className="p-6 space-y-4">
        <h2 className="text-lg font-semibold">Добавить товар</h2>
        <input
          className="border rounded-xl px-3 py-2 w-full"
          placeholder="Название"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="number"
          className="border rounded-xl px-3 py-2 w-full"
          placeholder="Цена"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
        />
        <Button
          onClick={() =>
            addProduct.mutate(
              { name, price },
              { onSuccess: () => setOpen(false) }
            )
          }
        >
          Создать
        </Button>
      </Modal.Content>
    </Modal>
  );
}
