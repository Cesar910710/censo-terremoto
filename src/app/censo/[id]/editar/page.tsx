import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FamilyForm } from "../../forms";

export const dynamic = "force-dynamic";

export default async function EditarBeneficiarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [family, materials, municipios] = await Promise.all([
    prisma.family.findUnique({
      where: { id },
      include: { materialsNeeded: { select: { id: true } } },
    }),
    // Catálogo completo (no filtrado por stock, a diferencia del registro
    // nuevo en /censo/registrar): al editar no queremos que un material que
    // ya se había marcado como necesitado desaparezca del checklist solo
    // porque el stock actual llegó a 0 — eso borraría esa necesidad al
    // guardar, no solo ocultarla.
    prisma.material.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] }),
    prisma.municipio.findMany({
      where: { department: "Valle del Cauca" },
      orderBy: { name: "asc" },
      select: { name: true },
    }),
  ]);

  if (!family) notFound();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-1">
        <Link href="/censo" className="text-sm text-zinc-500 hover:underline">
          ← Censo
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Editar beneficiario</h1>
      </div>

      <FamilyForm
        materials={materials}
        municipios={municipios.map((m) => m.name)}
        selfRegistered={false}
        editingFamily={{
          id: family.id,
          headOfHouseholdName: family.headOfHouseholdName,
          documentType: family.documentType,
          documentNumber: family.documentNumber,
          phone: family.phone,
          address: family.address,
          municipality: family.municipality,
          department: family.department,
          materialsNeeded: family.materialsNeeded.map((m) => m.id),
        }}
      />
    </main>
  );
}
