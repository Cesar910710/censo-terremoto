import Link from "next/link";
import { Gift } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { DonacionesTable } from "./donaciones-table";

// Igual que las demás páginas de inventario: consulta Prisma directo, así
// que necesita quedar marcada como dinámica o Next la dejaría fija desde el
// build.
export const dynamic = "force-dynamic";

export default async function DonacionesPage() {
  // Tope generoso en vez de paginar en la base de datos: para el volumen
  // real de un solo esfuerzo de respuesta local, traer todo y paginar en el
  // cliente es más simple que paginación por cursor.
  const movements = await prisma.inventoryMovement.findMany({
    where: { type: "ENTRADA" },
    orderBy: { occurredAt: "desc" },
    take: 1000,
    include: { material: { select: { name: true, unit: true } } },
  });

  const rows = movements.map((m) => ({
    key: m.id,
    occurredAt: m.occurredAt,
    materialName: m.material.name,
    materialUnit: m.material.unit,
    quantity: m.quantity,
    donorName: m.donorName ?? "—",
    note: m.note,
  }));

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <Link href="/inventario" className="text-sm text-zinc-500 hover:underline">
            ← Inventario
          </Link>
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <Gift className="h-5 w-5 text-green-600 dark:text-green-400" />
            Donaciones
          </h1>
        </div>
        <Link
          href="/donaciones/registrar"
          className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          Registrar donación
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-zinc-500">Aún no hay donaciones registradas.</p>
      ) : (
        <DonacionesTable rows={rows} />
      )}
    </main>
  );
}
