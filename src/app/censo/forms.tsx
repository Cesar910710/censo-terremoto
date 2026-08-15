"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

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
  const [submitted, setSubmitted] = useState(false);

  const materialsByCategory = useMemo(() => {
    const groups = new Map<string, Material[]>();
    for (const m of materials) {
      const key = m.category ?? "Otros";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(m);
    }
    return [...groups.entries()];
  }, [materials]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const data = new FormData(form);

    const body = {
      headOfHouseholdName: data.get("headOfHouseholdName") as string,
      documentType: data.get("documentType") as string,
      documentNumber: data.get("documentNumber") as string,
      address: data.get("address") as string,
      municipality: data.get("municipality") as string,
      department: data.get("department") as string,
      materialsNeeded: data.getAll("materialsNeeded") as string[],
      selfRegistered,
    };

    startTransition(async () => {
      const res = await fetch("/api/census/families", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        setError(
          payload?.error?.fieldErrors
            ? Object.values(payload.error.fieldErrors).flat().join(", ")
            : payload?.error || "No se pudo registrar"
        );
        return;
      }
      if (selfRegistered) {
        setSubmitted(true);
      } else {
        form.reset();
        router.refresh();
      }
    });
  }

  if (submitted) {
    return (
      <div className="flex flex-col gap-3 rounded-md border border-black/[.08] bg-zinc-50 p-4 text-sm dark:border-white/[.145] dark:bg-zinc-900">
        <p className="font-medium">¡Listo! Tu solicitud fue registrada.</p>
        <p className="text-zinc-600 dark:text-zinc-400">
          Pronto nos pondremos en contacto para coordinar la entrega.
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="self-start text-sm font-medium underline"
        >
          Registrar otra solicitud
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        type="text"
        name="headOfHouseholdName"
        placeholder="Nombres y apellidos"
        required
        className={inputClass}
      />

      <div className="flex gap-3">
        <select name="documentType" required className={inputClass} defaultValue="">
          <option value="" disabled>
            Tipo de identificación
          </option>
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

      <input type="text" name="address" placeholder="Dirección" required className={inputClass} />

      <div className="flex gap-3">
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

      <fieldset className="flex flex-col gap-3 rounded-md border border-black/[.08] p-3 dark:border-white/[.145]">
        <legend className="px-1 text-sm font-medium">¿Qué materiales necesitas?</legend>
        {materialsByCategory.map(([category, items]) => (
          <div key={category} className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-zinc-500">{category}</span>
            <div className="flex flex-col gap-1">
              {items.map((m) => (
                <label key={m.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="materialsNeeded" value={m.id} />
                  {m.name} ({m.unit})
                </label>
              ))}
            </div>
          </div>
        ))}
      </fieldset>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
      >
        {isPending ? "Guardando..." : "Registrar solicitud"}
      </button>
    </form>
  );
}
