import Link from "next/link";
import { getStock } from "@/lib/inventory";
import { prisma } from "@/lib/prisma";
import { NewMaterialForm } from "./forms";
import { StockTable } from "./stock-table";

// El stock cambia con cada donación/entrega registrada; sin esto Next
// prerenderiza la página una sola vez en build y sirve datos desactualizados
// (no usa fetch() ni APIs de request, así que nada más la marca como dinámica).
export const dynamic = "force-dynamic";

export default async function InventarioPage() {
  const [stock, categoryRows, unitRows] = await Promise.all([
    getStock(),
    prisma.materialCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.materialUnit.findMany({ orderBy: { name: "asc" } }),
  ]);
  const categories = categoryRows.map((c) => c.name);
  const units = unitRows.map((u) => u.name);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">Inventario</h1>
        <div className="flex flex-wrap gap-2">
          <NewMaterialForm categories={categories} units={units} />
          <Link
            href="/inventario/movimientos"
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            Registrar movimiento
          </Link>
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-zinc-500">Stock actual</h2>
        {stock.length === 0 ? (
          <p className="text-sm text-zinc-500">Aún no hay materiales registrados.</p>
        ) : (
          <StockTable stock={stock} />
        )}
      </section>
    </main>
  );
}
