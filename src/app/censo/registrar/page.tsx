import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { FamilyForm } from "../forms";

export const dynamic = "force-dynamic";

export default async function RegistrarFamiliaPage() {
  const [materials, municipios] = await Promise.all([
    prisma.material.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] }),
    prisma.municipio.findMany({
      where: { department: "Valle del Cauca" },
      orderBy: { name: "asc" },
      select: { name: true },
    }),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-1">
        <Link href="/censo" className="text-sm text-zinc-500 hover:underline">
          ← Censo
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Registrar familia</h1>
      </div>

      <FamilyForm
        materials={materials}
        municipios={municipios.map((m) => m.name)}
        selfRegistered={false}
      />
    </main>
  );
}
