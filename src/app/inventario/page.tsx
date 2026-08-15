import { prisma } from "@/lib/prisma";
import { getStock } from "@/lib/inventory";
import { MovementForm, NewMaterialForm } from "./forms";

// El stock y los movimientos cambian con cada donación/entrega registrada;
// sin esto Next prerenderiza la página una sola vez en build y sirve datos
// desactualizados (no usa fetch() ni APIs de request, así que nada más la
// marca como dinámica).
export const dynamic = "force-dynamic";

export default async function InventarioPage() {
  const [stock, materials, movements] = await Promise.all([
    getStock(),
    prisma.material.findMany({ orderBy: { name: "asc" } }),
    prisma.inventoryMovement.findMany({
      orderBy: { occurredAt: "desc" },
      take: 20,
      include: { material: { select: { name: true, unit: true } } },
    }),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
      <h1 className="text-xl font-semibold tracking-tight">Inventario</h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-zinc-500">Stock actual</h2>
        {stock.length === 0 ? (
          <p className="text-sm text-zinc-500">Aún no hay materiales registrados.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-black/[.08] dark:border-white/[.145]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/[.08] text-left dark:border-white/[.145]">
                  <th className="px-3 py-2 font-medium">Material</th>
                  <th className="px-3 py-2 font-medium">Unidad</th>
                  <th className="px-3 py-2 font-medium">Categoría</th>
                  <th className="px-3 py-2 text-right font-medium">Disponible</th>
                </tr>
              </thead>
              <tbody>
                {stock.map((s) => (
                  <tr key={s.materialId} className="border-b border-black/[.04] last:border-0 dark:border-white/[.08]">
                    <td className="px-3 py-2">{s.name}</td>
                    <td className="px-3 py-2">{s.unit}</td>
                    <td className="px-3 py-2">{s.category ?? "—"}</td>
                    <td className="px-3 py-2 text-right font-medium">{s.disponible}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <NewMaterialForm />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-zinc-500">Registrar movimiento</h2>
        <MovementForm materials={materials} />
      </section>

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
