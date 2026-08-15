"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Material = {
  id: string;
  name: string;
  unit: string;
};

const inputClass =
  "w-full rounded-md border border-black/[.08] bg-white px-3 py-2 text-sm dark:border-white/[.145] dark:bg-zinc-900";

export function MovementForm({ materials }: { materials: Material[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState<"ENTRADA" | "SALIDA">("ENTRADA");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const data = new FormData(form);

    const body = {
      materialId: data.get("materialId") as string,
      type,
      quantity: Number(data.get("quantity")),
      note: (data.get("note") as string) || undefined,
      donorName: type === "ENTRADA" ? (data.get("donorName") as string) || undefined : undefined,
      recipientName: type === "SALIDA" ? (data.get("recipientName") as string) || undefined : undefined,
    };

    startTransition(async () => {
      const res = await fetch("/api/inventory/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        setError(
          payload?.error?.fieldErrors
            ? Object.values(payload.error.fieldErrors).flat().join(", ")
            : payload?.error || "No se pudo registrar el movimiento"
        );
        return;
      }
      form.reset();
      router.refresh();
    });
  }

  if (materials.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Agrega un material antes de registrar movimientos.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-1.5">
          <input
            type="radio"
            name="movementType"
            checked={type === "ENTRADA"}
            onChange={() => setType("ENTRADA")}
          />
          Entrada (donación)
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="radio"
            name="movementType"
            checked={type === "SALIDA"}
            onChange={() => setType("SALIDA")}
          />
          Salida (entrega)
        </label>
      </div>

      <select name="materialId" required className={inputClass} defaultValue="">
        <option value="" disabled>
          Selecciona un material
        </option>
        {materials.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name} ({m.unit})
          </option>
        ))}
      </select>

      <input
        type="number"
        name="quantity"
        step="any"
        min="0"
        placeholder="Cantidad"
        required
        className={inputClass}
      />

      {type === "ENTRADA" ? (
        <input
          type="text"
          name="donorName"
          placeholder="Donante (opcional)"
          className={inputClass}
        />
      ) : (
        <input
          type="text"
          name="recipientName"
          placeholder="Familia / persona que recibe (opcional)"
          className={inputClass}
        />
      )}

      <textarea
        name="note"
        placeholder="Nota (opcional)"
        rows={2}
        className={inputClass}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
      >
        {isPending ? "Guardando..." : "Registrar movimiento"}
      </button>
    </form>
  );
}

export function NewMaterialForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const data = new FormData(form);

    const body = {
      name: data.get("name") as string,
      unit: data.get("unit") as string,
      category: (data.get("category") as string) || undefined,
    };

    startTransition(async () => {
      const res = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        setError(
          payload?.error?.fieldErrors
            ? Object.values(payload.error.fieldErrors).flat().join(", ")
            : "No se pudo crear el material"
        );
        return;
      }
      form.reset();
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="self-start text-sm font-medium underline"
      >
        + Nuevo material
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input type="text" name="name" placeholder="Nombre" required className={inputClass} />
      <input
        type="text"
        name="unit"
        placeholder="Unidad (bulto, saco, m2...)"
        required
        className={inputClass}
      />
      <input
        type="text"
        name="category"
        placeholder="Categoría (opcional)"
        className={inputClass}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
        >
          {isPending ? "Guardando..." : "Crear material"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md px-4 py-2 text-sm font-medium"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
