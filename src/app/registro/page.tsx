import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { FamilyForm } from "../censo/forms";
import { SyncStatus, PendingQueue } from "@/app/offline-ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Censo Damnificados",
};

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
      <div className="flex flex-col gap-3">
        <h1 className="text-xl font-semibold tracking-tight text-blue-400 dark:text-blue-300">
          Solicitud de Materiales de Construcción
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Regístrate para solicitar materiales de construcción si sufriste daños en tu hogar.
        </p>
      </div>

      <SyncStatus />

      <FamilyForm
        materials={materials}
        municipios={municipios.map((m) => m.name)}
        selfRegistered={true}
      />

      <PendingQueue />
    </main>
  );
}
