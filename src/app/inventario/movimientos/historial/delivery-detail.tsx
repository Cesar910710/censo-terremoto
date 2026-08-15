"use client";

import { useRef } from "react";

export function DeliveryDetailButton({
  recipient,
  materials,
}: {
  recipient: string;
  materials: { name: string; unit: string; quantity: number }[];
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="self-start rounded-md border border-black/[.08] px-3 py-1.5 text-xs font-medium hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-white/[.06]"
      >
        Ver detalle ({materials.length})
      </button>

      {/* <dialog> nativo: m-auto porque el preflight de Tailwind resetea el
          margin que el navegador usa para centrarlo, text-foreground porque
          el UA stylesheet le pone color:black que no hereda el tema. */}
      <dialog
        ref={dialogRef}
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current?.close();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-lg border-0 bg-white p-0 text-foreground shadow-lg backdrop:bg-black/40 dark:bg-zinc-900"
      >
        <div className="flex flex-col gap-3 p-5 text-sm">
          <div className="flex flex-col gap-0.5">
            <p className="text-base font-medium">Materiales entregados</p>
            <p className="text-zinc-600 dark:text-zinc-400">{recipient}</p>
          </div>
          <ul className="flex flex-col gap-1 border-t border-black/[.08] pt-2 dark:border-white/[.145]">
            {materials.map((m, i) => (
              <li key={i} className="flex items-center justify-between gap-3">
                <span>
                  {m.name} ({m.unit})
                </span>
                <span className="font-medium">{m.quantity}</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="self-end rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            Cerrar
          </button>
        </div>
      </dialog>
    </>
  );
}
