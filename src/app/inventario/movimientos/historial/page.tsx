import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DeliveryDetailButton } from "./delivery-detail";

// Igual que las demás páginas de inventario: consulta Prisma directo, así
// que necesita quedar marcada como dinámica o Next la dejaría fija desde el
// build.
export const dynamic = "force-dynamic";

export default async function HistorialMovimientosPage() {
  const movements = await prisma.inventoryMovement.findMany({
    orderBy: { occurredAt: "desc" },
    take: 50,
    include: {
      material: { select: { name: true, unit: true } },
      family: { select: { headOfHouseholdName: true } },
    },
  });

  // Las entregas con varios materiales a la vez comparten deliveryId (ver
  // MovementForm). Se agrupan aquí en una sola fila con un botón de detalle;
  // todo lo demás (Entradas, Salidas de un solo material sin deliveryId)
  // sigue mostrándose como una fila independiente, igual que antes.
  const rows: {
    key: string;
    occurredAt: Date;
    type: "ENTRADA" | "SALIDA";
    recipient: string;
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
        type: "SALIDA",
        recipient: m.family?.headOfHouseholdName ?? m.recipientName ?? "—",
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
      type: m.type,
      recipient: m.family?.headOfHouseholdName ?? m.donorName ?? m.recipientName ?? "—",
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
          <h1 className="text-xl font-semibold tracking-tight">Historial de movimientos</h1>
        </div>
        <Link
          href="/inventario/movimientos"
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          Registrar movimiento
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-zinc-500">Aún no hay movimientos registrados.</p>
      ) : (
        <>
          {/* Mobile: tarjetas apiladas — una tabla de 6 columnas no cabe
              legible en un teléfono, así que por debajo de md se listan como
              tarjetas y la tabla queda solo para pantallas grandes. */}
          <div className="flex flex-col gap-2 md:hidden">
            {rows.map((r) => (
              <div
                key={r.key}
                className="flex flex-col gap-1 rounded-md border border-black/[.08] p-3 text-sm dark:border-white/[.145]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{r.type === "ENTRADA" ? "Entrada" : "Salida"}</span>
                  <span className="text-xs text-zinc-500 whitespace-nowrap">
                    {r.occurredAt.toLocaleString("es-CO")}
                  </span>
                </div>
                {r.materials.length > 1 ? (
                  <span>{r.materials.length} materiales entregados</span>
                ) : (
                  <span>
                    {r.materials[0].name} ({r.materials[0].unit}) · {r.materials[0].quantity}
                  </span>
                )}
                <span className="text-zinc-600 dark:text-zinc-400">{r.recipient}</span>
                {r.note && <span className="text-xs text-zinc-500">{r.note}</span>}
                {r.type === "SALIDA" && (
                  <DeliveryDetailButton recipient={r.recipient} materials={r.materials} />
                )}
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-md border border-black/[.08] dark:border-white/[.145] md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/[.08] text-left dark:border-white/[.145]">
                  <th className="px-3 py-2 font-medium">Fecha</th>
                  <th className="px-3 py-2 font-medium">Tipo</th>
                  <th className="px-3 py-2 font-medium">Material</th>
                  <th className="px-3 py-2 text-right font-medium">Cantidad</th>
                  <th className="px-3 py-2 font-medium">Donante / destinatario</th>
                  <th className="px-3 py-2 font-medium">Nota</th>
                  <th className="px-3 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.key} className="border-b border-black/[.04] last:border-0 dark:border-white/[.08]">
                    <td className="px-3 py-2 whitespace-nowrap">
                      {r.occurredAt.toLocaleString("es-CO")}
                    </td>
                    <td className="px-3 py-2">{r.type === "ENTRADA" ? "Entrada" : "Salida"}</td>
                    <td className="px-3 py-2">
                      {r.materials.length > 1
                        ? `${r.materials.length} materiales`
                        : `${r.materials[0].name} (${r.materials[0].unit})`}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {r.materials.length > 1 ? "—" : r.materials[0].quantity}
                    </td>
                    <td className="px-3 py-2">{r.recipient}</td>
                    <td className="px-3 py-2">{r.note ?? "—"}</td>
                    <td className="px-3 py-2">
                      {r.type === "SALIDA" && (
                        <DeliveryDetailButton recipient={r.recipient} materials={r.materials} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}
