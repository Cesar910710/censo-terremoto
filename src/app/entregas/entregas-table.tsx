"use client";

import { useMemo, useState } from "react";
import { DeliveryDetailButton } from "./delivery-detail";

type SalidaRow = {
  key: string;
  occurredAt: Date;
  recipient: string;
  documento: string;
  note: string | null;
  materials: { name: string; unit: string; quantity: number }[];
};

const PAGE_SIZE = 5;
const loadMoreClass =
  "self-start rounded-md border border-black/[.08] px-4 py-2 text-sm font-medium hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-white/[.06]";
const inputClass =
  "w-full max-w-xs rounded-md border border-black/[.08] bg-white px-3 py-2 text-sm dark:border-white/[.145] dark:bg-zinc-900";

export function EntregasTable({ rows }: { rows: SalidaRow[] }) {
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Busca por documento o por nombre del destinatario.
  const filtered = useMemo(() => {
    const q = search.trim();
    if (!q) return rows;
    const qLower = q.toLowerCase();
    return rows.filter((r) => r.documento.includes(q) || r.recipient.toLowerCase().includes(qLower));
  }, [search, rows]);

  const visible = filtered.slice(0, visibleCount);

  return (
    <div className="flex flex-col gap-3">
      <input
        type="text"
        placeholder="Buscar por documento o nombre..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setVisibleCount(PAGE_SIZE);
        }}
        className={inputClass}
      />

      {filtered.length === 0 ? (
        <p className="text-sm text-zinc-500">
          {search ? "No se encontraron entregas con ese documento o nombre." : "Aún no hay entregas registradas."}
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-2 md:hidden">
            {visible.map((r) => (
              <div
                key={r.key}
                className="flex flex-col gap-1.5 rounded-md border border-amber-200 bg-amber-50/40 p-3 text-sm dark:border-amber-900 dark:bg-amber-950/20"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-zinc-500">Fecha</span>
                  <span className="text-right">{r.occurredAt.toLocaleString("es-CO")}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-zinc-500">Material</span>
                  <span className="text-right">
                    {r.materials.length > 1
                      ? `${r.materials.length} materiales`
                      : `${r.materials[0].name} (${r.materials[0].unit})`}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-zinc-500">Cantidad</span>
                  <span className="text-right font-semibold text-amber-700 dark:text-amber-400">
                    {r.materials.length > 1 ? "—" : `-${r.materials[0].quantity}`}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-zinc-500">Destinatario</span>
                  <span className="text-right">{r.recipient}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-zinc-500">Documento</span>
                  <span className="text-right">{r.documento}</span>
                </div>
                {r.note && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-zinc-500">Nota</span>
                    <span className="text-right">{r.note}</span>
                  </div>
                )}
                <DeliveryDetailButton recipient={r.recipient} materials={r.materials} />
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-md border border-amber-200 dark:border-amber-900 md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-amber-200 bg-amber-50/60 text-left dark:border-amber-900 dark:bg-amber-950/20">
                  <th className="px-3 py-2 font-medium">Fecha</th>
                  <th className="px-3 py-2 font-medium">Material</th>
                  <th className="px-3 py-2 text-right font-medium">Cantidad</th>
                  <th className="px-3 py-2 font-medium">Destinatario</th>
                  <th className="px-3 py-2 font-medium">Documento</th>
                  <th className="px-3 py-2 font-medium">Nota</th>
                  <th className="px-3 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => (
                  <tr key={r.key} className="border-b border-black/[.04] last:border-0 dark:border-white/[.08]">
                    <td className="px-3 py-2 whitespace-nowrap">{r.occurredAt.toLocaleString("es-CO")}</td>
                    <td className="px-3 py-2">
                      {r.materials.length > 1
                        ? `${r.materials.length} materiales`
                        : `${r.materials[0].name} (${r.materials[0].unit})`}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-amber-700 dark:text-amber-400">
                      {r.materials.length > 1 ? "—" : `-${r.materials[0].quantity}`}
                    </td>
                    <td className="px-3 py-2">{r.recipient}</td>
                    <td className="px-3 py-2">{r.documento}</td>
                    <td className="px-3 py-2">{r.note ?? "—"}</td>
                    <td className="px-3 py-2">
                      <DeliveryDetailButton recipient={r.recipient} materials={r.materials} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {visibleCount < filtered.length && (
            <button type="button" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)} className={loadMoreClass}>
              Cargar más ({visible.length} de {filtered.length})
            </button>
          )}
        </>
      )}
    </div>
  );
}
