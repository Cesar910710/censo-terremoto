import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { MovementForm, NewMaterialForm, PendingQueue } from "../forms";
import { SyncStatus } from "../sync-status";

// Los movimientos recientes cambian con cada registro; sin esto Next
// prerenderiza la página una sola vez en build y sirve datos desactualizados
// (no usa fetch() ni APIs de request, así que nada más la marca como dinámica).
export const dynamic = "force-dynamic";

export default async function MovimientosPage() {
  const [materials, movements] = await Promise.all([
    prisma.material.findMany({ orderBy: { name: "asc" } }),
    prisma.inventoryMovement.findMany({
      orderBy: { occurredAt: "desc" },
      take: 20,
      include: { material: { select: { name: true, unit: true } } },
    }),
  ]);

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
        <MovementForm materials={materials} />
        <div className="flex flex-col gap-1 border-t border-black/[.08] pt-3 dark:border-white/[.145]">
          <span className="text-xs text-zinc-500">
            ¿El material que buscas no está en la lista?
          </span>
          <NewMaterialForm />
        </div>
      </section>

      <PendingQueue />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-zinc-500">Movimientos recientes</h2>
        {movements.length === 0 ? (
          <p className="text-sm text-zinc-500">Aún no hay movimientos registrados.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-black/[.08] dark:border-white/[.145]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/[.08] text-left dark:border-white/[.145]">
                  <th className="px-3 py-2 font-medium">Fecha</th>
                  <th className="px-3 py-2 font-medium">Tipo</th>
                  <th className="px-3 py-2 font-medium">Material</th>
                  <th className="px-3 py-2 text-right font-medium">Cantidad</th>
                  <th className="px-3 py-2 font-medium">Donante / destinatario</th>
                  <th className="px-3 py-2 font-medium">Nota</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={m.id} className="border-b border-black/[.04] last:border-0 dark:border-white/[.08]">
                    <td className="px-3 py-2 whitespace-nowrap">
                      {m.occurredAt.toLocaleString("es-CO")}
                    </td>
                    <td className="px-3 py-2">{m.type === "ENTRADA" ? "Entrada" : "Salida"}</td>
                    <td className="px-3 py-2">
                      {m.material.name} ({m.material.unit})
                    </td>
                    <td className="px-3 py-2 text-right">{m.quantity}</td>
                    <td className="px-3 py-2">{m.donorName ?? m.recipientName ?? "—"}</td>
                    <td className="px-3 py-2">{m.note ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
