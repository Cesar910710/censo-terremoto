"use client";

import { useMemo, useState } from "react";
import { DeleteMaterialButton } from "./delete-material";

type StockItem = {
  materialId: string;
  name: string;
  unit: string;
  category: string | null;
  disponible: number;
};

const PAGE_SIZE = 5;
const inputClass =
  "w-full max-w-xs rounded-md border border-black/[.08] bg-white px-3 py-2 text-sm dark:border-white/[.145] dark:bg-zinc-900";

export function StockTable({ stock }: { stock: StockItem[] }) {
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return stock;
    return stock.filter((s) => s.name.toLowerCase().includes(q));
  }, [search, stock]);

  const visible = filtered.slice(0, visibleCount);

  return (
    <div className="flex flex-col gap-3">
      <input
        type="text"
        placeholder="Buscar por nombre..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setVisibleCount(PAGE_SIZE);
        }}
        className={inputClass}
      />

      {filtered.length === 0 ? (
        <p className="text-sm text-zinc-500">No se encontraron materiales con ese nombre.</p>
      ) : (
        <>
          {/* Mobile: tarjetas apiladas — una tabla de 4 columnas no cabe
              legible en un teléfono, así que por debajo de md se listan
              como tarjetas y la tabla queda solo para pantallas grandes. */}
          <div className="flex flex-col gap-2 md:hidden">
            {visible.map((s) => (
              <div
                key={s.materialId}
                className="flex flex-col gap-1.5 rounded-md border border-black/[.08] p-3 text-sm dark:border-white/[.145]"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-zinc-500">Material</span>
                  <span className="text-right font-medium">{s.name}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-zinc-500">Unidad</span>
                  <span className="text-right">{s.unit}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-zinc-500">Categoría</span>
                  <span className="text-right">{s.category ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-zinc-500">Disponible</span>
                  <span className="text-right font-semibold">{s.disponible}</span>
                </div>
                <DeleteMaterialButton materialId={s.materialId} materialName={s.name} />
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-md border border-black/[.08] dark:border-white/[.145] md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/[.08] text-left dark:border-white/[.145]">
                  <th className="px-3 py-2 font-medium">Material</th>
                  <th className="px-3 py-2 font-medium">Unidad</th>
                  <th className="px-3 py-2 font-medium">Categoría</th>
                  <th className="px-3 py-2 text-right font-medium">Disponible</th>
                  <th className="px-3 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((s) => (
                  <tr key={s.materialId} className="border-b border-black/[.04] last:border-0 dark:border-white/[.08]">
                    <td className="px-3 py-2">{s.name}</td>
                    <td className="px-3 py-2">{s.unit}</td>
                    <td className="px-3 py-2">{s.category ?? "—"}</td>
                    <td className="px-3 py-2 text-right font-medium">{s.disponible}</td>
                    <td className="px-3 py-2">
                      <DeleteMaterialButton materialId={s.materialId} materialName={s.name} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {visibleCount < filtered.length && (
            <button
              type="button"
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              className="self-start rounded-md border border-black/[.08] px-4 py-2 text-sm font-medium hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-white/[.06]"
            >
              Cargar más ({visible.length} de {filtered.length})
            </button>
          )}
        </>
      )}
    </div>
  );
}
