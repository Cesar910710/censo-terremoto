"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type OutboxItem } from "@/lib/offline-db";
import { submitOrQueue } from "@/lib/sync";
import { CATEGORIAS } from "@/lib/materiales.constants";

type Material = {
  id: string;
  name: string;
  unit: string;
  category: string | null;
};

const inputClass =
  "w-full rounded-md border border-black/[.08] bg-white px-3 py-2 text-sm dark:border-white/[.145] dark:bg-zinc-900";

// Modal de confirmación reutilizado por ambos formularios de creación
// (movimiento y material nuevo). Usa <dialog> nativo — m-auto es necesario
// porque el preflight de Tailwind resetea el margin que el navegador usa
// para centrar el modal por defecto.
function ConfirmDialog({
  dialogRef,
  title,
  description,
}: {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  title: string;
  description?: string;
}) {
  return (
    <dialog
      ref={dialogRef}
      onClick={(e) => {
        if (e.target === dialogRef.current) dialogRef.current?.close();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-lg border-0 bg-white p-0 text-foreground shadow-lg backdrop:bg-black/40 dark:bg-zinc-900"
    >
      <div className="flex flex-col gap-3 p-5 text-sm">
        <p className="text-base font-medium">{title}</p>
        {description && <p className="text-zinc-600 dark:text-zinc-400">{description}</p>}
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          className="self-end rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          Aceptar
        </button>
      </div>
    </dialog>
  );
}

type FamilyMatch = {
  id: string;
  headOfHouseholdName: string;
  documentNumber: string | null;
  municipality: string | null;
};

// Buscador con autocompletado contra familias censadas. Si la familia está
// censada, envía familyId; si no se encuentra o no hay conexión para
// buscarla, cae de vuelta al texto libre en recipientName (mismo criterio
// que ya tenía el schema: "recipientName solo aplica si aún no existe censo
// de la familia").
function FamilySearchInput() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FamilyMatch[]>([]);
  const [selected, setSelected] = useState<FamilyMatch | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (selected || query.trim().length < 2) {
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      fetch(`/api/census/families?q=${encodeURIComponent(query.trim())}`, {
        signal: controller.signal,
      })
        .then((res) => (res.ok ? res.json() : []))
        .then((data: FamilyMatch[]) => {
          setResults(data);
          setOpen(true);
        })
        .catch(() => {});
    }, 300);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query, selected]);

  const visibleResults = selected || query.trim().length < 2 ? [] : results;

  return (
    <div className="relative flex flex-col gap-1">
      <input
        type="text"
        placeholder="Familia / persona que recibe (opcional)"
        value={selected ? selected.headOfHouseholdName : query}
        onChange={(e) => {
          setSelected(null);
          setQuery(e.target.value);
        }}
        onFocus={() => visibleResults.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        autoComplete="off"
        className={inputClass}
      />
      <input type="hidden" name="recipientName" value={selected ? "" : query} />
      <input type="hidden" name="familyId" value={selected?.id ?? ""} />

      {selected && (
        <span className="text-xs text-green-700 dark:text-green-500">
          ✓ Familia censada{" "}
          <button
            type="button"
            onClick={() => {
              setSelected(null);
              setQuery("");
            }}
            className="underline"
          >
            quitar
          </button>
        </span>
      )}

      {open && !selected && visibleResults.length > 0 && (
        <ul className="absolute top-full z-10 mt-1 w-full rounded-md border border-black/[.08] bg-white text-sm shadow-md dark:border-white/[.145] dark:bg-zinc-900">
          {visibleResults.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setSelected(f);
                  setOpen(false);
                }}
                className="block w-full px-3 py-2 text-left hover:bg-black/[.04] dark:hover:bg-white/[.06]"
              >
                {f.headOfHouseholdName}
                {f.documentNumber ? ` · ${f.documentNumber}` : ""}
                {f.municipality ? ` · ${f.municipality}` : ""}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function MovementForm({ materials }: { materials: Material[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState<"ENTRADA" | "SALIDA">("ENTRADA");
  const [error, setError] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [lastQueued, setLastQueued] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

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
      familyId: type === "SALIDA" ? (data.get("familyId") as string) || undefined : undefined,
    };

    startTransition(async () => {
      const result = await submitOrQueue("movement", "/api/inventory/movements", body);
      if (result.error) {
        setError(result.error);
        return;
      }
      form.reset();
      setResetKey((k) => k + 1);
      setLastQueued(result.queued);
      if (!result.queued) router.refresh();
      dialogRef.current?.showModal();
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
    <>
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
        <FamilySearchInput key={resetKey} />
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

    <ConfirmDialog
      dialogRef={dialogRef}
      title={lastQueued ? "Guardado localmente" : "Movimiento registrado correctamente"}
      description={lastQueued ? "Se sincronizará automáticamente cuando haya conexión." : undefined}
    />
    </>
  );
}

export function NewMaterialForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [lastQueued, setLastQueued] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
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
      setLastQueued(result.queued);
      if (!result.queued) {
        setOpen(false);
        router.refresh();
      }
      dialogRef.current?.showModal();
    });
  }

  return (
    <>
    {!open ? (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="self-start text-sm font-medium underline"
      >
        + Nuevo material
      </button>
    ) : (
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input type="text" name="name" placeholder="Nombre" required className={inputClass} />
        <input
          type="text"
          name="unit"
          placeholder="Unidad (bulto, saco, m2...)"
          required
          className={inputClass}
        />
        <select name="category" className={inputClass} defaultValue="">
          <option value="">Categoría (opcional)</option>
          {CATEGORIAS.map((cat) => (
            <option key={cat.codigo} value={cat.nombre}>
              {cat.nombre}
            </option>
          ))}
        </select>

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
    )}

    <ConfirmDialog
      dialogRef={dialogRef}
      title={lastQueued ? "Guardado localmente" : "Material creado correctamente"}
      description={lastQueued ? "Se sincronizará automáticamente cuando haya conexión." : undefined}
    />
    </>
  );
}

