"use client";

import { useState } from "react";

type EntradaRow = {
  key: string;
  occurredAt: Date;
  materialName: string;
  materialUnit: string;
  quantity: number;
  donorName: string;
  note: string | null;
};

const PAGE_SIZE = 5;
const loadMoreClass =
  "self-start rounded-md border border-black/[.08] px-4 py-2 text-sm font-medium hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-white/[.06]";

export function DonacionesTable({ rows }: { rows: EntradaRow[] }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visible = rows.slice(0, visibleCount);

  return (
    <>
      <div className="flex flex-col gap-2 md:hidden">
        {visible.map((r) => (
          <div
            key={r.key}
            className="flex flex-col gap-1.5 rounded-md border border-green-200 bg-green-50/40 p-3 text-sm dark:border-green-900 dark:bg-green-950/20"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-zinc-500">Fecha</span>
              <span className="text-right">{r.occurredAt.toLocaleString("es-CO")}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-zinc-500">Material</span>
              <span className="text-right">
                {r.materialName} ({r.materialUnit})
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-zinc-500">Cantidad</span>
              <span className="text-right font-semibold text-green-700 dark:text-green-400">
                +{r.quantity}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-zinc-500">Donante</span>
              <span className="text-right">{r.donorName}</span>
            </div>
            {r.note && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-zinc-500">Nota</span>
                <span className="text-right">{r.note}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-md border border-green-200 dark:border-green-900 md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-green-200 bg-green-50/60 text-left dark:border-green-900 dark:bg-green-950/20">
              <th className="px-3 py-2 font-medium">Fecha</th>
              <th className="px-3 py-2 font-medium">Material</th>
              <th className="px-3 py-2 text-right font-medium">Cantidad</th>
              <th className="px-3 py-2 font-medium">Donante</th>
              <th className="px-3 py-2 font-medium">Nota</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.key} className="border-b border-black/[.04] last:border-0 dark:border-white/[.08]">
                <td className="px-3 py-2 whitespace-nowrap">{r.occurredAt.toLocaleString("es-CO")}</td>
                <td className="px-3 py-2">
                  {r.materialName} ({r.materialUnit})
                </td>
                <td className="px-3 py-2 text-right font-semibold text-green-700 dark:text-green-400">
                  +{r.quantity}
                </td>
                <td className="px-3 py-2">{r.donorName}</td>
                <td className="px-3 py-2">{r.note ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {visibleCount < rows.length && (
        <button type="button" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)} className={loadMoreClass}>
          Cargar más ({visible.length} de {rows.length})
        </button>
      )}
    </>
  );
}
