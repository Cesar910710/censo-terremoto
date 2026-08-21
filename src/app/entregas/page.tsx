import Link from "next/link";
import { Truck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { EntregasTable } from "./entregas-table";

// Igual que las demás páginas de inventario: consulta Prisma directo, así
// que necesita quedar marcada como dinámica o Next la dejaría fija desde el
// build.
export const dynamic = "force-dynamic";

export default async function EntregasPage() {
  const movements = await prisma.inventoryMovement.findMany({
    where: { type: "SALIDA" },
    orderBy: { occurredAt: "desc" },
    take: 1000,
    include: {
      material: { select: { name: true, unit: true } },
      family: { select: { headOfHouseholdName: true, documentNumber: true } },
    },
  });

  // Las entregas con varios materiales a la vez comparten deliveryId (ver
  // MovementForm). Se agrupan aquí en una sola fila con un botón de detalle;
  // las de un solo material (sin deliveryId) siguen siendo su propia fila.
  const rows: {
    key: string;
    occurredAt: Date;
    recipient: string;
    documento: string;
    note: string | null;
    materials: { name: string; unit: string; quantity: number }[];
  }[] = [];
  const seenDeliveries = new Set<string>();

  for (const m of movements) {
    if (m.deliveryId) {
      if (seenDeliveries.has(m.deliveryId)) continue;
      seenDeliveries.add(m.deliveryId);
      const group = movements.filter((mv) => mv.deliveryId === m.deliveryId);
      rows.push({
        key: m.deliveryId,
        occurredAt: m.occurredAt,
        recipient: m.family?.headOfHouseholdName ?? m.recipientName ?? "—",
        documento: m.family?.documentNumber ?? "—",
        note: m.note,
        materials: group.map((mv) => ({
          name: mv.material.name,
          unit: mv.material.unit,
          quantity: mv.quantity,
        })),
      });
      continue;
    }

    rows.push({
      key: m.id,
      occurredAt: m.occurredAt,
      recipient: m.family?.headOfHouseholdName ?? m.recipientName ?? "—",
      documento: m.family?.documentNumber ?? "—",
      note: m.note,
      materials: [{ name: m.material.name, unit: m.material.unit, quantity: m.quantity }],
    });
  }

  rows.sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <Link href="/inventario" className="text-sm text-zinc-500 hover:underline">
            ← Inventario
          </Link>
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <Truck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            Entregas
          </h1>
        </div>
        <Link
          href="/entregas/registrar"
          className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
        >
          Registrar entrega
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-zinc-500">Aún no hay entregas registradas.</p>
      ) : (
        <EntregasTable rows={rows} />
      )}
    </main>
  );
}
