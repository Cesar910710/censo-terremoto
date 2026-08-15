import { prisma } from "@/lib/prisma";
import { FamilyForm } from "../censo/forms";

export const dynamic = "force-dynamic";

export default async function RegistroPublicoPage() {
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
        <h1 className="text-xl font-semibold tracking-tight">Solicitud de materiales</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Regístrate para solicitar materiales de construcción por el terremoto.
        </p>
      </div>

      <FamilyForm
        materials={materials}
        municipios={municipios.map((m) => m.name)}
        selfRegistered={true}
      />
    </main>
  );
}
