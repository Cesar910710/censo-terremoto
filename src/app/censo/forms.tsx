"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitOrQueue } from "@/lib/sync";

type Material = {
  id: string;
  name: string;
  unit: string;
  category: string | null;
};

const inputClass =
  "w-full rounded-md border border-black/[.08] bg-white px-3 py-2 text-sm dark:border-white/[.145] dark:bg-zinc-900";

const documentTypeLabel: Record<string, string> = {
  CC: "Cédula de ciudadanía",
  TI: "Tarjeta de identidad",
  CE: "Cédula de extranjería",
  PA: "Pasaporte",
  RC: "Registro civil",
  PEP: "Permiso Especial de Permanencia (PEP)",
};

export function FamilyForm({
  materials,
  municipios,
  selfRegistered,
}: {
  materials: Material[];
  municipios: string[];
  selfRegistered: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastQueued, setLastQueued] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const materialsByCategory = useMemo(() => {
    const groups = new Map<string, Material[]>();
    for (const m of materials) {
      const key = m.category ?? "Otros";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(m);
    }
    return [...groups.entries()];
  }, [materials]);

  function handleMaterialsChange(e: React.ChangeEvent<HTMLDivElement>) {
    const target = e.target;
    if (!(target instanceof HTMLInputElement) || target.name !== "materialsNeeded") return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (target.checked) next.add(target.value);
      else next.delete(target.value);
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const data = new FormData(form);

    const body = {
      id: crypto.randomUUID(),
      headOfHouseholdName: data.get("headOfHouseholdName") as string,
      documentType: data.get("documentType") as string,
      documentNumber: data.get("documentNumber") as string,
      phone: data.get("phone") as string,
      address: data.get("address") as string,
      municipality: data.get("municipality") as string,
      department: data.get("department") as string,
      materialsNeeded: data.getAll("materialsNeeded") as string[],
      selfRegistered,
    };

    startTransition(async () => {
      const result = await submitOrQueue("family", "/api/census/families", body);
      if (result.error) {
        setError(result.error);
        return;
      }
      form.reset();
      setSelectedIds(new Set());
      setLastQueued(result.queued);
      if (!selfRegistered && !result.queued) router.refresh();
      dialogRef.current?.showModal();
    });
  }

  return (
    <>
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        type="text"
        name="headOfHouseholdName"
        placeholder="Nombres y apellidos"
        required
        className={inputClass}
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <select name="documentType" required className={inputClass} defaultValue="CC">
          {Object.entries(documentTypeLabel).map(([code, label]) => (
            <option key={code} value={code}>
              {label}
            </option>
          ))}
        </select>
        <input
          type="text"
          name="documentNumber"
          placeholder="Número de identificación"
          required
          className={inputClass}
        />
      </div>

      <input
        type="tel"
        name="phone"
        placeholder="Número de contacto"
        required
        className={inputClass}
      />

      <input type="text" name="address" placeholder="Dirección" required className={inputClass} />

      <div className="flex flex-col gap-3 sm:flex-row">
        <select
          name="municipality"
          required
          className={inputClass}
          defaultValue={municipios.includes("Versalles") ? "Versalles" : municipios[0]}
        >
          {municipios.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <input
          type="text"
          name="department"
          required
          defaultValue="Valle del Cauca"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-1">
          <span className="text-sm font-medium">¿Qué materiales necesitas?</span>
          <span
            className={`text-xs ${selectedIds.size > 0 ? (selfRegistered ? "font-medium text-blue-400 dark:text-blue-300" : "font-medium text-zinc-700 dark:text-zinc-300") : "text-zinc-500"}`}
          >
            {selectedIds.size} de {materials.length} seleccionados
          </span>
        </div>

        <div className="flex flex-col gap-2" onChange={handleMaterialsChange}>
          {materialsByCategory.map(([category, items]) => {
            const selectedInCategory = items.filter((m) => selectedIds.has(m.id)).length;
            return (
              <details
                key={category}
                className="rounded-md border border-black/[.08] dark:border-white/[.145]"
              >
                <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium">
                  {category}{" "}
                  <span className="font-normal text-zinc-500">
                    ({items.length}
                    {selectedInCategory > 0
                      ? `, ${selectedInCategory} seleccionado${selectedInCategory > 1 ? "s" : ""}`
                      : ""}
                    )
                  </span>
                </summary>
                <div className="flex flex-col gap-1.5 border-t border-black/[.08] px-3 py-2 dark:border-white/[.145]">
                  {items.map((m) => (
                    <label key={m.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="materialsNeeded"
                        value={m.id}
                        className={selfRegistered ? "accent-blue-400" : undefined}
                      />
                      {m.name} ({m.unit})
                    </label>
                  ))}
                </div>
              </details>
            );
          })}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className={
          selfRegistered
            ? "rounded-md bg-blue-400 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
            : "rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
        }
      >
        {isPending ? "Guardando..." : "Registrar solicitud"}
      </button>
    </form>

    <dialog
      ref={dialogRef}
      onClick={(e) => {
        if (e.target === dialogRef.current) dialogRef.current?.close();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-lg border-0 bg-white p-0 text-foreground shadow-lg backdrop:bg-black/40 dark:bg-zinc-900"
    >
      <div className="flex flex-col gap-3 p-5 text-sm">
        <p className="text-base font-medium">
          {selfRegistered
            ? lastQueued
              ? "Guardado en este dispositivo."
              : "¡Listo! Tu solicitud fue registrada."
            : lastQueued
              ? "Guardado localmente"
              : "Familia registrada correctamente."}
        </p>
        {selfRegistered && (
          <p className="text-zinc-600 dark:text-zinc-400">
            {lastQueued
              ? "Tu solicitud se enviará automáticamente en cuanto haya conexión a internet."
              : "Pronto nos pondremos en contacto para coordinar la entrega."}
          </p>
        )}
        {!selfRegistered && lastQueued && (
          <p className="text-zinc-600 dark:text-zinc-400">
            Se sincronizará automáticamente cuando haya conexión.
          </p>
        )}
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          className={
            selfRegistered
              ? "self-end rounded-md bg-blue-400 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
              : "self-end rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
          }
        >
          Aceptar
        </button>
      </div>
    </dialog>
    </>
  );
}
