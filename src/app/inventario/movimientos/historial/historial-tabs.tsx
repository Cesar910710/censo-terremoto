"use client";

import { useMemo, useState } from "react";
import { DeliveryDetailButton } from "./delivery-detail";

type EntradaRow = {
  key: string;
  occurredAt: Date;
  materialName: string;
  materialUnit: string;
  quantity: number;
  donorName: string;
  note: string | null;
};

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

export function HistorialTabs({
  entradaRows,
  salidaRows,
}: {
  entradaRows: EntradaRow[];
  salidaRows: SalidaRow[];
}) {
  const [tab, setTab] = useState<"ENTRADA" | "SALIDA">("ENTRADA");
  const [search, setSearch] = useState("");
  const [visibleEntrada, setVisibleEntrada] = useState(PAGE_SIZE);
  const [visibleSalida, setVisibleSalida] = useState(PAGE_SIZE);

  // El buscador solo tiene sentido en Salidas: es el único lado con un
  // documento de beneficiario asociado (las entradas registran donante, no
  // un censado con documento). Busca por documento o por nombre del
  // destinatario.
  const filteredSalida = useMemo(() => {
    const q = search.trim();
    if (!q) return salidaRows;
    const qLower = q.toLowerCase();
    return salidaRows.filter(
      (r) => r.documento.includes(q) || r.recipient.toLowerCase().includes(qLower)
    );
  }, [search, salidaRows]);

  const visibleEntradaRows = entradaRows.slice(0, visibleEntrada);
  const visibleSalidaRows = filteredSalida.slice(0, visibleSalida);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 border-b border-black/[.08] dark:border-white/[.145]">
        <button
          type="button"
          onClick={() => setTab("ENTRADA")}
          className={`border-b-2 px-3 py-2 text-sm font-medium ${
            tab === "ENTRADA"
              ? "border-foreground"
              : "border-transparent text-zinc-500 hover:text-foreground"
          }`}
        >
          Entradas ({entradaRows.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("SALIDA")}
          className={`border-b-2 px-3 py-2 text-sm font-medium ${
            tab === "SALIDA"
              ? "border-foreground"
              : "border-transparent text-zinc-500 hover:text-foreground"
          }`}
        >
          Salidas ({salidaRows.length})
        </button>
      </div>

      {tab === "SALIDA" && (
        <input
          type="text"
          placeholder="Buscar por documento o nombre..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setVisibleSalida(PAGE_SIZE);
          }}
          className={inputClass}
        />
      )}

      {tab === "ENTRADA" ? (
        entradaRows.length === 0 ? (
          <p className="text-sm text-zinc-500">Aún no hay entradas registradas.</p>
        ) : (
          <>
            <div className="flex flex-col gap-2 md:hidden">
              {visibleEntradaRows.map((r) => (
                <div
                  key={r.key}
                  className="flex flex-col gap-1.5 rounded-md border border-black/[.08] p-3 text-sm dark:border-white/[.145]"
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
                    <span className="text-right">{r.quantity}</span>
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

            <div className="hidden overflow-x-auto rounded-md border border-black/[.08] dark:border-white/[.145] md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/[.08] text-left dark:border-white/[.145]">
                    <th className="px-3 py-2 font-medium">Fecha</th>
                    <th className="px-3 py-2 font-medium">Material</th>
                    <th className="px-3 py-2 text-right font-medium">Cantidad</th>
                    <th className="px-3 py-2 font-medium">Donante</th>
                    <th className="px-3 py-2 font-medium">Nota</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleEntradaRows.map((r) => (
                    <tr key={r.key} className="border-b border-black/[.04] last:border-0 dark:border-white/[.08]">
                      <td className="px-3 py-2 whitespace-nowrap">{r.occurredAt.toLocaleString("es-CO")}</td>
                      <td className="px-3 py-2">
                        {r.materialName} ({r.materialUnit})
                      </td>
                      <td className="px-3 py-2 text-right">{r.quantity}</td>
                      <td className="px-3 py-2">{r.donorName}</td>
                      <td className="px-3 py-2">{r.note ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {visibleEntrada < entradaRows.length && (
              <button type="button" onClick={() => setVisibleEntrada((c) => c + PAGE_SIZE)} className={loadMoreClass}>
                Cargar más ({visibleEntradaRows.length} de {entradaRows.length})
              </button>
            )}
          </>
        )
      ) : filteredSalida.length === 0 ? (
        <p className="text-sm text-zinc-500">
          {search ? "No se encontraron salidas con ese documento o nombre." : "Aún no hay salidas registradas."}
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-2 md:hidden">
            {visibleSalidaRows.map((r) => (
              <div
                key={r.key}
                className="flex flex-col gap-1.5 rounded-md border border-black/[.08] p-3 text-sm dark:border-white/[.145]"
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
                  <span className="text-right">{r.materials.length > 1 ? "—" : r.materials[0].quantity}</span>
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

          <div className="hidden overflow-x-auto rounded-md border border-black/[.08] dark:border-white/[.145] md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/[.08] text-left dark:border-white/[.145]">
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
                {visibleSalidaRows.map((r) => (
                  <tr key={r.key} className="border-b border-black/[.04] last:border-0 dark:border-white/[.08]">
                    <td className="px-3 py-2 whitespace-nowrap">{r.occurredAt.toLocaleString("es-CO")}</td>
                    <td className="px-3 py-2">
                      {r.materials.length > 1
                        ? `${r.materials.length} materiales`
                        : `${r.materials[0].name} (${r.materials[0].unit})`}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {r.materials.length > 1 ? "—" : r.materials[0].quantity}
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

          {visibleSalida < filteredSalida.length && (
            <button type="button" onClick={() => setVisibleSalida((c) => c + PAGE_SIZE)} className={loadMoreClass}>
              Cargar más ({visibleSalidaRows.length} de {filteredSalida.length})
            </button>
          )}
        </>
      )}
    </div>
  );
}
