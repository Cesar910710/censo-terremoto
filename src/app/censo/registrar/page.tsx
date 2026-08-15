import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getStock } from "@/lib/inventory";
import { FamilyForm } from "../forms";
import { SyncStatus, PendingQueue } from "@/app/offline-ui";

export const dynamic = "force-dynamic";

export default async function RegistrarFamiliaPage() {
  const [stock, municipios] = await Promise.all([
    getStock(),
    prisma.municipio.findMany({
      where: { department: "Valle del Cauca" },
      orderBy: { name: "asc" },
      select: { name: true },
    }),
  ]);
  // Solo se pueden marcar materiales que sí hay disponibles para entregar —
  // a diferencia de /registro (landing pública), que muestra el catálogo
  // completo porque ahí se está registrando la necesidad de la familia, no
  // lo que el equipo interno puede prometer entregar en el momento.
  const materials = stock
    .filter((s) => s.disponible > 0)
    .map((s) => ({ id: s.materialId, name: s.name, unit: s.unit, category: s.category }))
    .sort((a, b) => (a.category ?? "").localeCompare(b.category ?? "") || a.name.localeCompare(b.name));

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-1">
        <Link href="/censo" className="text-sm text-zinc-500 hover:underline">
          ← Censo
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Registrar familia</h1>
      </div>

      <SyncStatus />

      <FamilyForm
        materials={materials}
        municipios={municipios.map((m) => m.name)}
        selfRegistered={false}
      />

      <PendingQueue />
    </main>
  );
}
