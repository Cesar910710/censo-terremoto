import Link from "next/link";
import { prisma } from "@/lib/prisma";

// Igual que /inventario: esta página solo consulta Prisma directo (sin
// fetch/cookies), así que Next la prerenderizaría estática en build sin este
// export — force-dynamic la mantiene fresca en cada request.
export const dynamic = "force-dynamic";

export default async function CensoPage() {
  const families = await prisma.family.findMany({
    orderBy: { createdAt: "desc" },
    include: { materialsNeeded: { select: { name: true } } },
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
                  className="flex flex-col gap-1 rounded-md border border-black/[.08] p-3 text-sm dark:border-white/[.145]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{f.headOfHouseholdName}</span>
                    <span className="shrink-0 text-xs text-zinc-500">{f.reviewStatus}</span>
                  </div>
                  <span className="text-zinc-600 dark:text-zinc-400">
                    {f.documentType} {f.documentNumber} · {f.phone ?? "—"}
                  </span>
                  <span className="text-zinc-600 dark:text-zinc-400">
                    {f.municipality}, {f.department}
                  </span>
                  <span className="text-zinc-600 dark:text-zinc-400">
                    {f.materialsNeeded.map((m) => m.name).join(", ") || "—"}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {f.selfRegistered ? "Autorregistro" : "Interno"}
                  </span>
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
                        {f.materialsNeeded.map((m) => m.name).join(", ") || "—"}
                      </td>
                      <td className="px-3 py-2">{f.selfRegistered ? "Autorregistro" : "Interno"}</td>
                      <td className="px-3 py-2">{f.reviewStatus}</td>
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
