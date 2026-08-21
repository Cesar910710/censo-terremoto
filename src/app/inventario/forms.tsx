"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type OutboxItem } from "@/lib/offline-db";
import { submitOrQueue } from "@/lib/sync";
import { CreatableSelect } from "./creatable-select";

type Material = {
  id: string;
  name: string;
  unit: string;
  category: string | null;
};

// El prop que recibe MovementForm trae además el disponible actual (para
// filtrar y mostrar en el checklist de Salida) — pero ese número es volátil
// (cambia con cada movimiento), así que nunca se guarda en la caché offline
// de Dexie, solo se usa en memoria mientras dura la vista de esta página.
type MaterialWithStock = Material & { disponible: number };

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
  // El cierre en onBlur se retrasa 150ms para no cerrar antes de procesar el
  // click en un resultado — pero si el usuario vuelve a enfocar/escribir
  // dentro de esos 150ms (p.ej. tras "quitar"), ese timeout viejo puede
  // reabrirse en falso a "cerrado" pisando el setOpen(true) más reciente.
  // Se guarda el id para poder cancelarlo en cuanto haya una interacción nueva.
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
          if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
          setSelected(null);
          setQuery(e.target.value);
        }}
        onFocus={() => {
          if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
          if (visibleResults.length > 0) setOpen(true);
        }}
        onBlur={() => {
          blurTimeoutRef.current = setTimeout(() => setOpen(false), 150);
        }}
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

// Buscador con autocompletado sobre los materiales ya cargados en memoria
// (a diferencia de FamilySearchInput, no hace falta pedirlos al servidor —
// Entrada ya recibe la lista completa sin filtrar por stock). Si lo que se
// busca no existe, permite crearlo ahí mismo sin salir del formulario de
// movimiento; al crearlo queda seleccionado de inmediato.
function MaterialSearchInput({
  materials,
  categories,
  units,
}: {
  materials: Material[];
  categories: string[];
  units: string[];
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Material | null>(null);
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createUnit, setCreateUnit] = useState("");
  const [createCategory, setCreateCategory] = useState("");
  const [createPending, startCreateTransition] = useTransition();
  const [createError, setCreateError] = useState<string | null>(null);
  // Ver el comentario equivalente en FamilySearchInput: cancela el cierre en
  // onBlur si el usuario vuelve a interactuar dentro de los 150ms, para que
  // un timeout viejo no cierre el dropdown justo después de reabrirlo.
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return materials;
    return materials.filter((m) => m.name.toLowerCase().includes(q));
  }, [query, materials]);

  const visibleResults = selected ? [] : filtered;

  function handleCreate() {
    const name = query.trim();
    if (!name || !createUnit.trim()) {
      setCreateError("Nombre y unidad son obligatorios");
      return;
    }
    setCreateError(null);
    const body = {
      id: crypto.randomUUID(),
      name,
      unit: createUnit.trim(),
      category: createCategory || undefined,
    };
    startCreateTransition(async () => {
      const result = await submitOrQueue("material", "/api/materials", body);
      if (result.error) {
        setCreateError(result.error);
        return;
      }
      setSelected({ id: body.id, name: body.name, unit: body.unit, category: body.category ?? null });
      setShowCreate(false);
      setOpen(false);
    });
  }

  return (
    <div className="relative flex flex-col gap-1">
      <input
        type="text"
        placeholder="Buscar material..."
        value={selected ? `${selected.name} (${selected.unit})` : query}
        onChange={(e) => {
          if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
          setSelected(null);
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
          setOpen(true);
        }}
        onBlur={() => {
          blurTimeoutRef.current = setTimeout(() => setOpen(false), 150);
        }}
        autoComplete="off"
        required
        className={inputClass}
      />
      <input type="hidden" name="materialId" required value={selected?.id ?? ""} />

      {selected && (
        <span className="text-xs text-green-700 dark:text-green-500">
          ✓ Seleccionado{" "}
          <button
            type="button"
            onClick={() => {
              setSelected(null);
              setQuery("");
            }}
            className="underline"
          >
            cambiar
          </button>
        </span>
      )}

      {(open || showCreate) && !selected && (
        <div className="absolute top-full z-10 mt-1 w-full rounded-md border border-black/[.08] bg-white text-sm shadow-md dark:border-white/[.145] dark:bg-zinc-900">
          {!showCreate && (
            <>
              {visibleResults.length > 0 && (
                <ul className="max-h-56 overflow-y-auto">
                  {visibleResults.map((m) => (
                    <li key={m.id}>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setSelected(m);
                          setOpen(false);
                        }}
                        className="block w-full px-3 py-2 text-left hover:bg-black/[.04] dark:hover:bg-white/[.06]"
                      >
                        {m.name} ({m.unit})
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setShowCreate(true)}
                className={`block w-full px-3 py-2 text-left text-zinc-600 hover:bg-black/[.04] dark:text-zinc-400 dark:hover:bg-white/[.06] ${visibleResults.length > 0 ? "border-t border-black/[.08] dark:border-white/[.145]" : ""}`}
              >
                + Crear material nuevo{query.trim() ? ` "${query.trim()}"` : ""}
              </button>
            </>
          )}

          {showCreate && (
            <div className="flex flex-col gap-2 p-3">
              <input
                type="text"
                placeholder="Nombre"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={inputClass}
              />
              <CreatableSelect
                value={createUnit}
                onValueChange={setCreateUnit}
                options={units}
                placeholder="Selecciona una unidad"
                addEndpoint="/api/material-units"
                addLabel="Nueva unidad"
              />
              <CreatableSelect
                value={createCategory}
                onValueChange={setCreateCategory}
                options={categories}
                placeholder="Categoría (opcional)"
                addEndpoint="/api/material-categories"
                addLabel="Nueva categoría"
              />
              {createError && <p className="text-xs text-red-600">{createError}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={createPending}
                  className="rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background disabled:opacity-50"
                >
                  {createPending ? "Creando..." : "Crear y seleccionar"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="rounded-md px-3 py-1.5 text-xs font-medium"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function MovementForm({
  materials,
  categories,
  units,
  lockedType,
}: {
  materials: MaterialWithStock[];
  categories: string[];
  units: string[];
  // Cuando viene fijo (páginas dedicadas /donaciones/registrar y
  // /entregas/registrar), se oculta el selector Entrada/Salida y el
  // formulario queda fijo en ese tipo — a diferencia de
  // /inventario/movimientos, que sigue mostrando ambos.
  lockedType?: "ENTRADA" | "SALIDA";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState<"ENTRADA" | "SALIDA">(lockedType ?? "ENTRADA");
  const [error, setError] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmDescription, setConfirmDescription] = useState<string | undefined>(undefined);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Salida: cantidades por material seleccionado (id → texto de cantidad).
  // Se maneja como estado propio, no como campos de formulario, porque cada
  // fila del checklist necesita su propio input controlado.
  const [salidaQuantities, setSalidaQuantities] = useState<Map<string, string>>(new Map());

  // Semilla la caché local con lo que llegó del servidor, así el <select>
  // sigue funcionando aunque se pierda la conexión después. No se guarda
  // "disponible" — es volátil, cambia con cada movimiento, y cachearlo
  // llevaría a mostrar cantidades desactualizadas más adelante.
  useEffect(() => {
    db.materials
      .bulkPut(materials.map(({ id, name, unit, category }) => ({ id, name, unit, category })))
      .catch(() => {});
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

  // El checklist de Salida solo tiene sentido para lo que hay disponible
  // ahora mismo — se arma directo del prop (que ya trae el disponible del
  // servidor), no de la caché offline, que a propósito no guarda stock.
  const salidaMaterials = useMemo(
    () => materials.filter((m) => m.disponible > 0),
    [materials]
  );

  const salidaMaterialsByCategory = useMemo(() => {
    const groups = new Map<string, MaterialWithStock[]>();
    for (const m of salidaMaterials) {
      const key = m.category ?? "Otros";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(m);
    }
    return [...groups.entries()];
  }, [salidaMaterials]);

  function toggleSalidaMaterial(materialId: string, checked: boolean) {
    setSalidaQuantities((prev) => {
      const next = new Map(prev);
      if (checked) next.set(materialId, next.get(materialId) ?? "");
      else next.delete(materialId);
      return next;
    });
  }

  function setSalidaQuantity(materialId: string, value: string) {
    setSalidaQuantities((prev) => new Map(prev).set(materialId, value));
  }

  function handleSubmitEntrada(form: HTMLFormElement, data: FormData) {
    const materialId = data.get("materialId") as string;
    // El input de materialId es un <input type="hidden">, así que "required"
    // no lo valida el navegador (los hidden lo ignoran) — se valida a mano.
    if (!materialId) {
      setError("Busca y selecciona un material");
      return;
    }

    const body = {
      id: crypto.randomUUID(),
      materialId,
      type: "ENTRADA",
      quantity: Number(data.get("quantity")),
      note: (data.get("note") as string) || undefined,
      donorName: (data.get("donorName") as string) || undefined,
    };

    startTransition(async () => {
      const result = await submitOrQueue("movement", "/api/inventory/movements", body);
      if (result.error) {
        setError(result.error);
        return;
      }
      form.reset();
      setResetKey((k) => k + 1);
      setConfirmTitle(result.queued ? "Guardado localmente" : "Movimiento registrado correctamente");
      setConfirmDescription(
        result.queued ? "Se sincronizará automáticamente cuando haya conexión." : undefined
      );
      if (!result.queued) router.refresh();
      dialogRef.current?.showModal();
    });
  }

  function handleSubmitSalida(form: HTMLFormElement, data: FormData) {
    const entries = [...salidaQuantities.entries()].filter(([, qty]) => qty.trim() !== "");
    if (entries.length === 0) {
      setError("Selecciona al menos un material y su cantidad a entregar");
      return;
    }
    if (entries.some(([, qty]) => !(Number(qty) > 0))) {
      setError("La cantidad debe ser mayor a 0 para cada material seleccionado");
      return;
    }

    const note = (data.get("note") as string) || undefined;
    const recipientName = (data.get("recipientName") as string) || undefined;
    const familyId = (data.get("familyId") as string) || undefined;

    // Solo se comparte deliveryId cuando hay más de un material: así las
    // entregas de un solo material quedan igual que antes (sin agrupar) en
    // el historial.
    const deliveryId = entries.length > 1 ? crypto.randomUUID() : undefined;

    startTransition(async () => {
      const results: { queued: boolean; error?: string }[] = [];
      for (const [materialId, quantity] of entries) {
        const body = {
          id: crypto.randomUUID(),
          materialId,
          type: "SALIDA",
          quantity: Number(quantity),
          note,
          recipientName,
          familyId,
          deliveryId,
        };
        results.push(await submitOrQueue("movement", "/api/inventory/movements", body));
      }

      const succeeded = results.filter((r) => !r.error);
      const failed = results.filter((r) => r.error);

      if (succeeded.length === 0) {
        setError(failed[0]?.error ?? "No se pudo registrar la entrega");
        return;
      }

      form.reset();
      setSalidaQuantities(new Map());
      setResetKey((k) => k + 1);

      if (failed.length > 0) {
        setError(`${failed.length} de ${results.length} materiales no se pudieron registrar.`);
      } else {
        setError(null);
      }

      const queuedCount = succeeded.filter((r) => r.queued).length;
      const onlineCount = succeeded.length - queuedCount;
      if (onlineCount > 0) router.refresh();

      if (queuedCount === 0) {
        setConfirmTitle("Entrega registrada correctamente");
        setConfirmDescription(undefined);
      } else if (queuedCount === succeeded.length) {
        setConfirmTitle("Guardado localmente");
        setConfirmDescription("Se sincronizará automáticamente cuando haya conexión.");
      } else {
        setConfirmTitle("Entrega registrada");
        setConfirmDescription(
          `${onlineCount} material(es) sincronizado(s) ahora, ${queuedCount} pendiente(s) por conexión.`
        );
      }
      dialogRef.current?.showModal();
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const data = new FormData(form);
    if (type === "ENTRADA") {
      handleSubmitEntrada(form, data);
    } else {
      handleSubmitSalida(form, data);
    }
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
      {!lockedType && (
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
      )}

      {type === "ENTRADA" ? (
        <>
          <MaterialSearchInput
            key={resetKey}
            materials={availableMaterials}
            categories={categories}
            units={units}
          />

          <input
            type="number"
            name="quantity"
            step="any"
            min="0"
            placeholder="Cantidad"
            required
            className={inputClass}
          />

          <input
            type="text"
            name="donorName"
            placeholder="Donante (opcional)"
            className={inputClass}
          />
        </>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <span className="text-sm font-medium">Materiales a entregar</span>
              <span className="text-xs text-zinc-500">
                {salidaQuantities.size} seleccionado{salidaQuantities.size === 1 ? "" : "s"}
              </span>
            </div>
            {salidaMaterials.length === 0 ? (
              <p className="text-sm text-zinc-500">No hay materiales con stock disponible.</p>
            ) : (
            <div className="flex flex-col gap-2">
              {salidaMaterialsByCategory.map(([category, items]) => (
                <details
                  key={category}
                  className="rounded-md border border-black/[.08] dark:border-white/[.145]"
                >
                  <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium">
                    {category} <span className="font-normal text-zinc-500">({items.length})</span>
                  </summary>
                  <div className="flex flex-col gap-2 border-t border-black/[.08] px-3 py-2 dark:border-white/[.145]">
                    {items.map((m) => {
                      const checked = salidaQuantities.has(m.id);
                      return (
                        <div key={m.id} className="flex items-center gap-2">
                          <label className="flex flex-1 items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => toggleSalidaMaterial(m.id, e.target.checked)}
                            />
                            <span>
                              {m.name} ({m.unit})
                              <span className="ml-1 text-xs text-zinc-500">
                                · Disponible: {m.disponible}
                              </span>
                            </span>
                          </label>
                          {checked && (
                            <input
                              type="number"
                              min="0"
                              step="any"
                              placeholder="Cantidad"
                              value={salidaQuantities.get(m.id) ?? ""}
                              onChange={(e) => setSalidaQuantity(m.id, e.target.value)}
                              className="w-24 rounded-md border border-black/[.08] bg-white px-2 py-1.5 text-sm dark:border-white/[.145] dark:bg-zinc-900"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </details>
              ))}
            </div>
            )}
          </div>

          <FamilySearchInput key={resetKey} />
        </>
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
        {isPending
          ? "Guardando..."
          : lockedType === "ENTRADA"
            ? "Registrar donación"
            : lockedType === "SALIDA"
              ? "Registrar entrega"
              : "Registrar movimiento"}
      </button>
    </form>

    <ConfirmDialog dialogRef={dialogRef} title={confirmTitle} description={confirmDescription} />
    </>
  );
}

export function NewMaterialForm({ categories, units }: { categories: string[]; units: string[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [lastQueued, setLastQueued] = useState(false);
  // Fuerza el remontaje de los CreatableSelect tras guardar — son
  // controlados internamente (mantienen su propio estado aunque el <form>
  // circundante haga form.reset()), así que sin esto el picklist seguiría
  // mostrando la última unidad/categoría elegida la próxima vez que se abra
  // el modal.
  const [resetKey, setResetKey] = useState(0);
  const formDialogRef = useRef<HTMLDialogElement>(null);
  const confirmDialogRef = useRef<HTMLDialogElement>(null);

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
      setResetKey((k) => k + 1);
      setLastQueued(result.queued);
      formDialogRef.current?.close();
      if (!result.queued) router.refresh();
      confirmDialogRef.current?.showModal();
    });
  }

  return (
    <>
    <button
      type="button"
      onClick={() => formDialogRef.current?.showModal()}
      className="self-start rounded-md border border-black/[.08] px-4 py-2 text-sm font-medium hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-white/[.06]"
    >
      + Nuevo material
    </button>

    <dialog
      ref={formDialogRef}
      onClick={(e) => {
        if (e.target === formDialogRef.current) formDialogRef.current?.close();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-lg border-0 bg-white p-0 text-foreground shadow-lg backdrop:bg-black/40 dark:bg-zinc-900"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-5">
        <p className="text-base font-medium">Nuevo material</p>
        <input type="text" name="name" placeholder="Nombre" required className={inputClass} />
        <CreatableSelect
          key={`unit-${resetKey}`}
          name="unit"
          options={units}
          placeholder="Selecciona una unidad"
          addEndpoint="/api/material-units"
          addLabel="Nueva unidad"
          required
        />
        <CreatableSelect
          key={`category-${resetKey}`}
          name="category"
          options={categories}
          placeholder="Categoría (opcional)"
          addEndpoint="/api/material-categories"
          addLabel="Nueva categoría"
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
            onClick={() => formDialogRef.current?.close()}
            className="rounded-md px-4 py-2 text-sm font-medium"
          >
            Cancelar
          </button>
        </div>
      </form>
    </dialog>

    <ConfirmDialog
      dialogRef={confirmDialogRef}
      title={lastQueued ? "Guardado localmente" : "Material creado correctamente"}
      description={lastQueued ? "Se sincronizará automáticamente cuando haya conexión." : undefined}
    />
    </>
  );
}

