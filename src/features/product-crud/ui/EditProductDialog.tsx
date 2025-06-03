// src/features/product-crud/ui/EditProductDialog.tsx
import { useState } from "react";
import { Modal, Button } from "@/shared/ui";
import { Product } from "@/entities/product";
import { useProductMutations } from "../model/useProductMutations";

interface Props { product: Product; }

export function EditProductDialog({ product }: Props) {
  const { updateProduct } = useProductMutations();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(product.price);

  return (
    <Modal open={open} onOpenChange={setOpen}>
      <Modal.Trigger asChild>
        <Button variant="outline" size="sm">Редактировать</Button>
      </Modal.Trigger>
      <Modal.Content className="p-6 space-y-4">
        <h2 className="text-lg font-semibold">Редактировать товар</h2>
        <input
          className="border rounded-xl px-3 py-2 w-full"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="number"
          className="border rounded-xl px-3 py-2 w-full"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
        />
        <Button
          onClick={() =>
            updateProduct.mutate(
              { id: product.id, name, price },
              { onSuccess: () => setOpen(false) }
            )
          }
        >
          Сохранить
        </Button>
      </Modal.Content>
    </Modal>
  );
}
