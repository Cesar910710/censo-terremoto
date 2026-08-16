"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function DeleteMaterialButton({
  materialId,
  materialName,
}: {
  materialId: string;
  materialName: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/materials/${materialId}`, { method: "DELETE" });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(typeof data.error === "string" ? data.error : "No se pudo eliminar");
          return;
        }
        dialogRef.current?.close();
        router.refresh();
      } catch {
        setError("No se pudo eliminar. Verifica tu conexión.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          dialogRef.current?.showModal();
        }}
        className="rounded-md border border-black/[.08] px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-white/[.145] dark:text-red-400 dark:hover:bg-red-950/20"
      >
        Eliminar
      </button>

      <dialog
        ref={dialogRef}
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current?.close();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-lg border-0 bg-white p-0 text-foreground shadow-lg backdrop:bg-black/40 dark:bg-zinc-900"
      >
        <div className="flex flex-col gap-3 p-5 text-sm">
          <p className="text-base font-medium">¿Eliminar {materialName}?</p>
          <p className="text-zinc-600 dark:text-zinc-400">Esta acción no se puede deshacer.</p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="rounded-md px-4 py-2 text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isPending ? "Eliminando..." : "Eliminar"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
