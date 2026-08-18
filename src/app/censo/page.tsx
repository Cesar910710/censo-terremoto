import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { MaterialsNeededDetailButton } from "./materials-needed-detail";

// Igual que /inventario: esta página solo consulta Prisma directo (sin
// fetch/cookies), así que Next la prerenderizaría estática en build sin este
// export — force-dynamic la mantiene fresca en cada request.
export const dynamic = "force-dynamic";

export default async function CensoPage() {
  const families = await prisma.family.findMany({
    orderBy: { createdAt: "desc" },
    include: { materialsNeeded: { select: { name: true, unit: true } } },
  });

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">Censo</h1>
        <Link
          href="/censo/registrar"
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          Registrar beneficiario
        </Link>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-zinc-500">Familias registradas</h2>
        {families.length === 0 ? (
          <p className="text-sm text-zinc-500">Aún no hay familias registradas.</p>
        ) : (
          <>
            {/* Mobile: tarjetas apiladas — una tabla de 7 columnas no cabe
                legible en un teléfono, así que por debajo de md se listan
                como tarjetas y la tabla queda solo para pantallas grandes. */}
            <div className="flex flex-col gap-2 md:hidden">
              {families.map((f) => (
                <div
                  key={f.id}
                  className="flex flex-col gap-1.5 rounded-md border border-black/[.08] p-3 text-sm dark:border-white/[.145]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-zinc-500">Nombre</span>
                    <span className="text-right font-medium">{f.headOfHouseholdName}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-zinc-500">Documento</span>
                    <span className="text-right">
                      {f.documentType} {f.documentNumber}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-zinc-500">Teléfono</span>
                    <span className="text-right">{f.phone ?? "—"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-zinc-500">Municipio</span>
                    <span className="text-right">
                      {f.municipality}, {f.department}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-zinc-500">Materiales</span>
                    {f.materialsNeeded.length > 0 ? (
                      <MaterialsNeededDetailButton
                        beneficiaryName={f.headOfHouseholdName}
                        materials={f.materialsNeeded}
                      />
                    ) : (
                      <span className="text-right">—</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-zinc-500">Origen</span>
                    <span className="text-right">
                      {f.selfRegistered ? "Autorregistro" : "Interno"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-zinc-500">Estado</span>
                    <span className="text-right">{f.reviewStatus}</span>
                  </div>
                  <Link
                    href={`/censo/${f.id}/editar`}
                    className="rounded-md border border-black/[.08] px-3 py-1.5 text-center text-xs font-medium hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-white/[.06]"
                  >
                    Editar
                  </Link>
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto rounded-md border border-black/[.08] dark:border-white/[.145] md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/[.08] text-left dark:border-white/[.145]">
                    <th className="px-3 py-2 font-medium">Nombre</th>
                    <th className="px-3 py-2 font-medium">Documento</th>
                    <th className="px-3 py-2 font-medium">Contacto</th>
                    <th className="px-3 py-2 font-medium">Municipio</th>
                    <th className="px-3 py-2 font-medium">Materiales</th>
                    <th className="px-3 py-2 font-medium">Origen</th>
                    <th className="px-3 py-2 font-medium">Estado</th>
                    <th className="px-3 py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {families.map((f) => (
                    <tr key={f.id} className="border-b border-black/[.04] last:border-0 dark:border-white/[.08]">
                      <td className="px-3 py-2">{f.headOfHouseholdName}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {f.documentType} {f.documentNumber}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">{f.phone ?? "—"}</td>
                      <td className="px-3 py-2">
                        {f.municipality}, {f.department}
                      </td>
                      <td className="px-3 py-2">
                        {f.materialsNeeded.length > 0 ? (
                          <MaterialsNeededDetailButton
                            beneficiaryName={f.headOfHouseholdName}
                            materials={f.materialsNeeded}
                          />
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 py-2">{f.selfRegistered ? "Autorregistro" : "Interno"}</td>
                      <td className="px-3 py-2">{f.reviewStatus}</td>
                      <td className="px-3 py-2">
                        <Link
                          href={`/censo/${f.id}/editar`}
                          className="rounded-md border border-black/[.08] px-3 py-1 text-xs font-medium hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-white/[.06]"
                        >
                          Editar
                        </Link>
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
