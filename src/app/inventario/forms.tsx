"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type OutboxItem } from "@/lib/offline-db";
import { enqueue, discardItem, retryItem } from "@/lib/sync";

type Material = {
  id: string;
  name: string;
  unit: string;
  category: string | null;
};

const inputClass =
  "w-full rounded-md border border-black/[.08] bg-white px-3 py-2 text-sm dark:border-white/[.145] dark:bg-zinc-900";

// Intenta la red primero; si no hay conexión (o se cae a mitad de la
// petición), encola en Dexie en vez de perder el registro. Un error real del
// servidor (ej. validación) sí se muestra, no se encola.
async function submitOrQueue(
  kind: "material" | "movement",
  endpoint: string,
  payload: Record<string, unknown>
): Promise<{ queued: boolean; error?: string }> {
  if (navigator.onLine) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) return { queued: false };
      const body = await res.json().catch(() => null);
      const error = body?.error?.fieldErrors
        ? Object.values(body.error.fieldErrors).flat().join(", ")
        : body?.error || "No se pudo guardar";
      return { queued: false, error };
    } catch {
      // navigator.onLine decía que sí, pero la petición falló igual
      // (conexión intermitente) — cae al camino de encolar.
    }
  }
  await enqueue(kind, payload);
  return { queued: true };
}

export function MovementForm({ materials }: { materials: Material[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState<"ENTRADA" | "SALIDA">("ENTRADA");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Semilla la caché local con lo que llegó del servidor, así el <select>
  // sigue funcionando aunque se pierda la conexión después.
  useEffect(() => {
    db.materials.bulkPut(materials).catch(() => {});
  }, [materials]);

  const cachedMaterials = useLiveQuery(() => db.materials.orderBy("name").toArray(), [], materials);
  const pendingMaterials = useLiveQuery(
    () => db.outbox.where("kind").equals("material").toArray(),
    [],
    [] as OutboxItem[]
  );

  const availableMaterials = useMemo(() => {
    const byId = new Map((cachedMaterials ?? materials).map((m) => [m.id, m]));
    for (const item of pendingMaterials ?? []) {
      if (item.status === "error" || byId.has(item.id)) continue;
      byId.set(item.id, {
        id: item.id,
        name: item.payload.name as string,
        unit: item.payload.unit as string,
        category: (item.payload.category as string | undefined) ?? null,
      });
    }
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [cachedMaterials, pendingMaterials, materials]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const form = e.currentTarget;
    const data = new FormData(form);

    const body = {
      id: crypto.randomUUID(),
      materialId: data.get("materialId") as string,
      type,
      quantity: Number(data.get("quantity")),
      note: (data.get("note") as string) || undefined,
      donorName: type === "ENTRADA" ? (data.get("donorName") as string) || undefined : undefined,
      recipientName: type === "SALIDA" ? (data.get("recipientName") as string) || undefined : undefined,
    };

    startTransition(async () => {
      const result = await submitOrQueue("movement", "/api/inventory/movements", body);
      if (result.error) {
        setError(result.error);
        return;
      }
      form.reset();
      if (result.queued) {
        setInfo("Guardado localmente. Se sincronizará cuando haya conexión.");
        setTimeout(() => setInfo(null), 6000);
      } else {
        router.refresh();
      }
    });
  }

  if (availableMaterials.length === 0) {
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
        {availableMaterials.map((m) => (
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
      {info && <p className="text-sm text-amber-600">{info}</p>}

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
  const [info, setInfo] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const form = e.currentTarget;
    const data = new FormData(form);

    const body = {
      id: crypto.randomUUID(),
      name: data.get("name") as string,
      unit: data.get("unit") as string,
      category: (data.get("category") as string) || undefined,
    };

    startTransition(async () => {
      const result = await submitOrQueue("material", "/api/materials", body);
      if (result.error) {
        setError(result.error);
        return;
      }
      form.reset();
      if (result.queued) {
        setInfo("Guardado localmente. Se sincronizará cuando haya conexión.");
        setTimeout(() => setInfo(null), 6000);
      } else {
        setOpen(false);
        router.refresh();
      }
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
      {info && <p className="text-sm text-amber-600">{info}</p>}

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

const kindLabel: Record<OutboxItem["kind"], string> = {
  material: "Material nuevo",
  movement: "Movimiento",
};

const statusLabel: Record<OutboxItem["status"], string> = {
  pending: "Pendiente de sincronizar",
  syncing: "Sincronizando...",
  error: "Error al sincronizar",
};

export function PendingQueue() {
  const items = useLiveQuery(() => db.outbox.orderBy("createdAt").toArray(), [], [] as OutboxItem[]);

  if (!items || items.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950">
      <p className="font-medium text-amber-800 dark:text-amber-300">
        Guardado localmente ({items.length})
      </p>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-2">
            <span>
              {kindLabel[item.kind]}
              {item.kind === "material" ? ` — ${item.payload.name}` : ""}
              <span className="text-zinc-500"> · {statusLabel[item.status]}</span>
              {item.error && <span className="block text-red-600">{item.error}</span>}
            </span>
            {item.status === "error" && (
              <span className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => retryItem(item.id)}
                  className="text-xs font-medium underline"
                >
                  Reintentar
                </button>
                <button
                  type="button"
                  onClick={() => discardItem(item.id)}
                  className="text-xs font-medium text-red-600 underline"
                >
                  Descartar
                </button>
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
