import Link from "next/link";
import { getStock } from "@/lib/inventory";
import { prisma } from "@/lib/prisma";
import { MovementForm, NewMaterialForm } from "../forms";
import { SyncStatus, PendingQueue } from "@/app/offline-ui";

// Los movimientos recientes cambian con cada registro; sin esto Next
// prerenderiza la página una sola vez en build y sirve datos desactualizados
// (no usa fetch() ni APIs de request, así que nada más la marca como dinámica).
export const dynamic = "force-dynamic";

export default async function MovimientosPage() {
  // getStock() (no prisma.material.findMany directo) porque el formulario de
  // Salida necesita saber cuánto hay disponible de cada material para
  // filtrar y mostrar la cantidad.
  const [stock, categoryRows, unitRows] = await Promise.all([
    getStock(),
    prisma.materialCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.materialUnit.findMany({ orderBy: { name: "asc" } }),
  ]);
  const materials = stock.map((s) => ({
    id: s.materialId,
    name: s.name,
    unit: s.unit,
    category: s.category,
    disponible: s.disponible,
  }));
  const categories = categoryRows.map((c) => c.name);
  const units = unitRows.map((u) => u.name);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-1">
        <Link href="/inventario" className="text-sm text-zinc-500 hover:underline">
          ← Inventario
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Registrar movimiento</h1>
      </div>

      <SyncStatus />

      <section className="flex flex-col gap-3">
        <MovementForm materials={materials} categories={categories} units={units} />
        <div className="flex flex-col gap-1 border-t border-black/[.08] pt-3 dark:border-white/[.145]">
          <span className="text-xs text-zinc-500">
            ¿El material que buscas no está en la lista?
          </span>
          <NewMaterialForm categories={categories} units={units} />
        </div>
      </section>

      <PendingQueue />

      <Link
        href="/inventario/movimientos/historial"
        className="self-start rounded-md border border-black/[.08] px-4 py-2 text-sm font-medium hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-white/[.06]"
      >
        Historial de movimientos
      </Link>
    </main>
  );
}
