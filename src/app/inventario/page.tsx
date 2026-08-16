import Link from "next/link";
import { getStock } from "@/lib/inventory";
import { NewMaterialForm } from "./forms";
import { DeleteMaterialButton } from "./delete-material";

// El stock cambia con cada donación/entrega registrada; sin esto Next
// prerenderiza la página una sola vez en build y sirve datos desactualizados
// (no usa fetch() ni APIs de request, así que nada más la marca como dinámica).
export const dynamic = "force-dynamic";

export default async function InventarioPage() {
  const stock = await getStock();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">Inventario</h1>
        <div className="flex flex-wrap gap-2">
          <NewMaterialForm />
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
          <>
            {/* Mobile: tarjetas apiladas — una tabla de 4 columnas no cabe
                legible en un teléfono, así que por debajo de md se listan
                como tarjetas y la tabla queda solo para pantallas grandes. */}
            <div className="flex flex-col gap-2 md:hidden">
              {stock.map((s) => (
                <div
                  key={s.materialId}
                  className="flex flex-col gap-2 rounded-md border border-black/[.08] p-3 dark:border-white/[.145]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">{s.name}</span>
                      <span className="text-xs text-zinc-500">
                        {s.unit} · {s.category ?? "—"}
                      </span>
                    </div>
                    <span className="shrink-0 text-lg font-semibold">{s.disponible}</span>
                  </div>
                  <DeleteMaterialButton materialId={s.materialId} materialName={s.name} />
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto rounded-md border border-black/[.08] dark:border-white/[.145] md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/[.08] text-left dark:border-white/[.145]">
                    <th className="px-3 py-2 font-medium">Material</th>
                    <th className="px-3 py-2 font-medium">Unidad</th>
                    <th className="px-3 py-2 font-medium">Categoría</th>
                    <th className="px-3 py-2 text-right font-medium">Disponible</th>
                    <th className="px-3 py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {stock.map((s) => (
                    <tr key={s.materialId} className="border-b border-black/[.04] last:border-0 dark:border-white/[.08]">
                      <td className="px-3 py-2">{s.name}</td>
                      <td className="px-3 py-2">{s.unit}</td>
                      <td className="px-3 py-2">{s.category ?? "—"}</td>
                      <td className="px-3 py-2 text-right font-medium">{s.disponible}</td>
                      <td className="px-3 py-2">
                        <DeleteMaterialButton materialId={s.materialId} materialName={s.name} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
