import Link from "next/link";
import { Truck } from "lucide-react";
import { getStock } from "@/lib/inventory";
import { prisma } from "@/lib/prisma";
import { MovementForm } from "@/app/inventario/forms";
import { SyncStatus, PendingQueue } from "@/app/offline-ui";

// Igual que las demás páginas de inventario: consulta Prisma directo, así
// que necesita quedar marcada como dinámica o Next la dejaría fija desde el
// build.
export const dynamic = "force-dynamic";

export default async function RegistrarEntregaPage() {
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
        <Link href="/entregas" className="text-sm text-zinc-500 hover:underline">
          ← Entregas
        </Link>
        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
          <Truck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          Registrar entrega
        </h1>
      </div>

      <SyncStatus />

      <section className="flex flex-col gap-3">
        <MovementForm materials={materials} categories={categories} units={units} lockedType="SALIDA" />
      </section>

      <PendingQueue />
    </main>
  );
}
