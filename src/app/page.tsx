import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-zinc-50 px-4 py-16 dark:bg-black">
      <h1 className="text-2xl font-semibold tracking-tight">
        Censo Terremoto
      </h1>
      <p className="max-w-md text-center text-zinc-600 dark:text-zinc-400">
        Inventario de donaciones y censo de familias afectadas.
      </p>
      <div className="flex flex-col gap-4 sm:flex-row">
        <Link
          href="/inventario"
          className="flex h-24 w-56 flex-col items-center justify-center gap-1 rounded-lg border border-black/[.08] bg-white text-center transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:bg-zinc-900 dark:hover:bg-zinc-800"
        >
          <span className="font-medium">Inventario</span>
          <span className="text-sm text-zinc-500">Donaciones y entregas</span>
        </Link>
        <Link
          href="/censo"
          className="flex h-24 w-56 flex-col items-center justify-center gap-1 rounded-lg border border-black/[.08] bg-white text-center transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:bg-zinc-900 dark:hover:bg-zinc-800"
        >
          <span className="font-medium">Censo</span>
          <span className="text-sm text-zinc-500">Familias y solicitudes</span>
        </Link>
      </div>
    </main>
  );
}
