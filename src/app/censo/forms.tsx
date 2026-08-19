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

type EditingFamily = {
  id: string;
  headOfHouseholdName: string;
  documentType: string | null;
  documentNumber: string | null;
  phone: string | null;
  address: string | null;
  municipality: string | null;
  department: string | null;
  materialsNeeded: string[];
};

export function FamilyForm({
  materials,
  municipios,
  selfRegistered,
  editingFamily,
}: {
  materials: Material[];
  municipios: string[];
  selfRegistered: boolean;
  editingFamily?: EditingFamily;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(editingFamily?.materialsNeeded ?? [])
  );
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

    // Solo headOfHouseholdName es obligatorio; el resto queda como undefined
    // (no como string vacío) si no se llenó, para que se guarde NULL en vez
    // de "" y los fallback ("—") de los listados sigan funcionando.
    const optionalText = (name: string) => (data.get(name) as string) || undefined;

    const fields = {
      headOfHouseholdName: data.get("headOfHouseholdName") as string,
      documentType: optionalText("documentType"),
      documentNumber: optionalText("documentNumber"),
      phone: optionalText("phone"),
      address: optionalText("address"),
      municipality: optionalText("municipality"),
      department: optionalText("department"),
      materialsNeeded: data.getAll("materialsNeeded") as string[],
    };

    // Editar es una corrección administrativa poco frecuente, no una acción
    // crítica de campo como el registro inicial — a diferencia del resto del
    // módulo, no pasa por la cola offline; si no hay conexión simplemente
    // falla con un mensaje claro en vez de encolarse.
    if (editingFamily) {
      startTransition(async () => {
        try {
          const res = await fetch(`/api/census/families/${editingFamily.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(fields),
          });
          const resData = await res.json().catch(() => ({}));
          if (!res.ok) {
            setError(typeof resData.error === "string" ? resData.error : "No se pudo guardar los cambios");
            return;
          }
          router.push("/censo");
          router.refresh();
        } catch {
          setError("No se pudo guardar. Verifica tu conexión.");
        }
      });
      return;
    }

    const body = { id: crypto.randomUUID(), ...fields, selfRegistered };

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
        defaultValue={editingFamily?.headOfHouseholdName}
        className={inputClass}
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <select
          name="documentType"
          required={selfRegistered}
          className={inputClass}
          defaultValue={editingFamily?.documentType ?? "CC"}
        >
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
          required={selfRegistered}
          defaultValue={editingFamily?.documentNumber ?? undefined}
          className={inputClass}
        />
      </div>

      <input
        type="tel"
        name="phone"
        placeholder="Número de contacto"
        required={selfRegistered}
        defaultValue={editingFamily?.phone ?? undefined}
        className={inputClass}
      />

      <input
        type="text"
        name="address"
        placeholder="Dirección"
        defaultValue={editingFamily?.address ?? undefined}
        className={inputClass}
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <select
          name="municipality"
          className={inputClass}
          defaultValue={
            editingFamily?.municipality ?? (municipios.includes("Versalles") ? "Versalles" : municipios[0])
          }
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
          defaultValue={editingFamily?.department ?? "Valle del Cauca"}
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
                        defaultChecked={selectedIds.has(m.id)}
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
        {isPending ? "Guardando..." : editingFamily ? "Guardar cambios" : "Registrar solicitud"}
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
              : "Beneficiario registrado correctamente."}
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
