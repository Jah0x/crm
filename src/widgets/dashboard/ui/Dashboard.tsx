// src/widgets/dashboard/ui/Dashboard.tsx
import { Card } from "@/shared/ui";
import { useProductList } from "@/entities/product";
import { formatMoney } from "@/shared/lib";

function StatsCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4 flex flex-col gap-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-xl font-semibold">{value}</span>
    </Card>
  );
}

export function Dashboard() {
  const { data = [] } = useProductList();
  const lowStock = data.filter((p) => p.inStock < p.lowStockThreshold);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <StatsCard label="Товаров" value={String(data.length)} />
      <StatsCard
        label="Ниже порога"
        value={String(lowStock.length)}
      />
      <StatsCard label="Выручка (MVP)" value={formatMoney(0)} />

      <Card className="md:col-span-2 p-4">
        <h3 className="font-semibold mb-2">Недостаточный запас</h3>
        <ul className="list-disc pl-4 space-y-1 text-sm">
          {lowStock.map((p) => (
            <li key={p.id}>
              {p.name} ― осталось {p.inStock}
            </li>
          ))}
          {lowStock.length === 0 && (
            <span className="text-muted-foreground">Все в порядке ✅</span>
          )}
        </ul>
      </Card>
    </div>
  );
}
