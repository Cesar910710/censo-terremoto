import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { HistorialTabs } from "./historial-tabs";

// Igual que las demás páginas de inventario: consulta Prisma directo, así
// que necesita quedar marcada como dinámica o Next la dejaría fija desde el
// build.
export const dynamic = "force-dynamic";

export default async function HistorialMovimientosPage() {
  // Tope generoso en vez de paginar en la base de datos: para el volumen
  // real de un solo esfuerzo de respuesta local (decenas/cientos de
  // movimientos, no miles), traer todo y paginar/filtrar en el cliente es
  // más simple que paginación por cursor — sobre todo porque las entregas
  // multi-material ya se agrupan en memoria (ver deliveryId abajo).
  const movements = await prisma.inventoryMovement.findMany({
    orderBy: { occurredAt: "desc" },
    take: 1000,
    include: {
      material: { select: { name: true, unit: true } },
      family: { select: { headOfHouseholdName: true, documentNumber: true } },
    },
  });

  const entradaRows: {
    key: string;
    occurredAt: Date;
    materialName: string;
    materialUnit: string;
    quantity: number;
    donorName: string;
    note: string | null;
  }[] = [];

  const salidaRows: {
    key: string;
    occurredAt: Date;
    recipient: string;
    documento: string;
    note: string | null;
    materials: { name: string; unit: string; quantity: number }[];
  }[] = [];

  // Las entregas con varios materiales a la vez comparten deliveryId (ver
  // MovementForm). Se agrupan aquí en una sola fila con un botón de detalle;
  // las de un solo material (sin deliveryId) siguen siendo su propia fila.
  const seenDeliveries = new Set<string>();

  for (const m of movements) {
    if (m.type === "ENTRADA") {
      entradaRows.push({
        key: m.id,
        occurredAt: m.occurredAt,
        materialName: m.material.name,
        materialUnit: m.material.unit,
        quantity: m.quantity,
        donorName: m.donorName ?? "—",
        note: m.note,
      });
      continue;
    }

    if (m.deliveryId) {
      if (seenDeliveries.has(m.deliveryId)) continue;
      seenDeliveries.add(m.deliveryId);
      const group = movements.filter((mv) => mv.deliveryId === m.deliveryId);
      salidaRows.push({
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

    salidaRows.push({
      key: m.id,
      occurredAt: m.occurredAt,
      recipient: m.family?.headOfHouseholdName ?? m.recipientName ?? "—",
      documento: m.family?.documentNumber ?? "—",
      note: m.note,
      materials: [{ name: m.material.name, unit: m.material.unit, quantity: m.quantity }],
    });
  }

  entradaRows.sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());
  salidaRows.sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <Link href="/inventario" className="text-sm text-zinc-500 hover:underline">
            ← Inventario
          </Link>
          <h1 className="text-xl font-semibold tracking-tight">Historial de movimientos</h1>
        </div>
        <Link
          href="/inventario/movimientos"
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          Registrar movimiento
        </Link>
      </div>

      {entradaRows.length === 0 && salidaRows.length === 0 ? (
        <p className="text-sm text-zinc-500">Aún no hay movimientos registrados.</p>
      ) : (
        <HistorialTabs entradaRows={entradaRows} salidaRows={salidaRows} />
      )}
    </main>
  );
}
