import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { FamiliesTable } from "./families-table";

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
          <FamiliesTable families={families} />
        )}
      </section>
    </main>
  );
}
