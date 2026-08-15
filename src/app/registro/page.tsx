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
      <div className="flex flex-col gap-5">
        <h1 className="text-3xl font-bold tracking-tight text-balance text-blue-500 dark:text-blue-300 sm:text-4xl">
          Solicitud de Materiales de Construcción
        </h1>
        <p className="rounded-r-lg border-l-4 border-blue-400 bg-blue-50 py-4 pr-4 pl-5 text-base leading-7 font-medium text-zinc-800 shadow-sm dark:border-blue-500 dark:bg-blue-950/20 dark:text-zinc-100">
          Esta página pretende recopilar datos de personas damnificadas por el terremoto del
          pasado lunes 10 de agosto. Si su casa sufrió daños y quiere solicitar material de
          construcción donado, por favor llene el formulario a continuación.
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
