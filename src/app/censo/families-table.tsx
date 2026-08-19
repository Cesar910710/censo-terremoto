"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MaterialsNeededDetailButton } from "./materials-needed-detail";

type Family = {
  id: string;
  headOfHouseholdName: string;
  documentType: string | null;
  documentNumber: string | null;
  phone: string | null;
  municipality: string | null;
  department: string | null;
  selfRegistered: boolean;
  reviewStatus: string;
  materialsNeeded: { name: string; unit: string }[];
};

const PAGE_SIZE = 5;
const inputClass =
  "w-full max-w-xs rounded-md border border-black/[.08] bg-white px-3 py-2 text-sm dark:border-white/[.145] dark:bg-zinc-900";

export function FamiliesTable({ families }: { families: Family[] }) {
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return families;
    return families.filter(
      (f) => f.documentNumber?.includes(search.trim()) || f.headOfHouseholdName.toLowerCase().includes(q)
    );
  }, [search, families]);

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
        <p className="text-sm text-zinc-500">No se encontraron beneficiarios con ese documento o nombre.</p>
      ) : (
        <>
          {/* Mobile: tarjetas apiladas — una tabla de 7 columnas no cabe
              legible en un teléfono, así que por debajo de md se listan
              como tarjetas y la tabla queda solo para pantallas grandes. */}
          <div className="flex flex-col gap-2 md:hidden">
            {visible.map((f) => (
              <div
                key={f.id}
                className="flex flex-col gap-1.5 rounded-md border border-black/[.08] p-3 text-sm dark:border-white/[.145]"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-zinc-500">Nombre</span>
                  <span className="text-right font-medium">{f.headOfHouseholdName}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-zinc-500">Documento</span>
                  <span className="text-right">
                    {f.documentType} {f.documentNumber}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-zinc-500">Teléfono</span>
                  <span className="text-right">{f.phone ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-zinc-500">Municipio</span>
                  <span className="text-right">
                    {f.municipality}, {f.department}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-zinc-500">Materiales</span>
                  {f.materialsNeeded.length > 0 ? (
                    <MaterialsNeededDetailButton
                      beneficiaryName={f.headOfHouseholdName}
                      materials={f.materialsNeeded}
                    />
                  ) : (
                    <span className="text-right">—</span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-zinc-500">Origen</span>
                  <span className="text-right">{f.selfRegistered ? "Autorregistro" : "Interno"}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-zinc-500">Estado</span>
                  <span className="text-right">{f.reviewStatus}</span>
                </div>
                <Link
                  href={`/censo/${f.id}/editar`}
                  className="rounded-md border border-black/[.08] px-3 py-1.5 text-center text-xs font-medium hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-white/[.06]"
                >
                  Editar
                </Link>
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-md border border-black/[.08] dark:border-white/[.145] md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/[.08] text-left dark:border-white/[.145]">
                  <th className="px-3 py-2 font-medium">Nombre</th>
                  <th className="px-3 py-2 font-medium">Documento</th>
                  <th className="px-3 py-2 font-medium">Contacto</th>
                  <th className="px-3 py-2 font-medium">Municipio</th>
                  <th className="px-3 py-2 font-medium">Materiales</th>
                  <th className="px-3 py-2 font-medium">Origen</th>
                  <th className="px-3 py-2 font-medium">Estado</th>
                  <th className="px-3 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((f) => (
                  <tr key={f.id} className="border-b border-black/[.04] last:border-0 dark:border-white/[.08]">
                    <td className="px-3 py-2">{f.headOfHouseholdName}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {f.documentType} {f.documentNumber}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">{f.phone ?? "—"}</td>
                    <td className="px-3 py-2">
                      {f.municipality}, {f.department}
                    </td>
                    <td className="px-3 py-2">
                      {f.materialsNeeded.length > 0 ? (
                        <MaterialsNeededDetailButton
                          beneficiaryName={f.headOfHouseholdName}
                          materials={f.materialsNeeded}
                        />
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2">{f.selfRegistered ? "Autorregistro" : "Interno"}</td>
                    <td className="px-3 py-2">{f.reviewStatus}</td>
                    <td className="px-3 py-2">
                      <Link
                        href={`/censo/${f.id}/editar`}
                        className="rounded-md border border-black/[.08] px-3 py-1 text-xs font-medium hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-white/[.06]"
                      >
                        Editar
                      </Link>
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
