import Link from "next/link";
import { prisma } from "@/lib/prisma";

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

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-1">
        <Link href="/inventario/movimientos" className="text-sm text-zinc-500 hover:underline">
          ← Registrar movimiento
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Historial de movimientos</h1>
      </div>

      {movements.length === 0 ? (
        <p className="text-sm text-zinc-500">Aún no hay movimientos registrados.</p>
      ) : (
        <>
          {/* Mobile: tarjetas apiladas — una tabla de 6 columnas no cabe
              legible en un teléfono, así que por debajo de md se listan como
              tarjetas y la tabla queda solo para pantallas grandes. */}
          <div className="flex flex-col gap-2 md:hidden">
            {movements.map((m) => (
              <div
                key={m.id}
                className="flex flex-col gap-1 rounded-md border border-black/[.08] p-3 text-sm dark:border-white/[.145]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{m.type === "ENTRADA" ? "Entrada" : "Salida"}</span>
                  <span className="text-xs text-zinc-500 whitespace-nowrap">
                    {m.occurredAt.toLocaleString("es-CO")}
                  </span>
                </div>
                <span>
                  {m.material.name} ({m.material.unit}) · {m.quantity}
                </span>
                <span className="text-zinc-600 dark:text-zinc-400">
                  {m.family?.headOfHouseholdName ?? m.donorName ?? m.recipientName ?? "—"}
                </span>
                {m.note && <span className="text-xs text-zinc-500">{m.note}</span>}
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
                    <td className="px-3 py-2">
                      {m.family?.headOfHouseholdName ?? m.donorName ?? m.recipientName ?? "—"}
                    </td>
                    <td className="px-3 py-2">{m.note ?? "—"}</td>
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
