"use client";

import { useState, useTransition } from "react";

const inputClass =
  "w-full rounded-md border border-black/[.08] bg-white px-3 py-2 text-sm dark:border-white/[.145] dark:bg-zinc-900";

// Picklist "parametrizable": la lista de opciones viene de una tabla de
// referencia (MaterialCategory/MaterialUnit) en vez de estar fija en código,
// y esta misma UI permite agregar una opción nueva sin salir del formulario
// de material — el POST la crea (o la reutiliza si ya existía) y la deja
// seleccionada de inmediato.
export function CreatableSelect({
  name,
  value,
  onValueChange,
  options,
  placeholder,
  addEndpoint,
  addLabel,
  required = false,
  defaultValue = "",
}: {
  // Modo formulario (no controlado): pasa `name`, se lee con FormData al
  // enviar el <form> que lo contiene (así se usa en NewMaterialForm).
  name?: string;
  // Modo controlado: pasa `value`/`onValueChange` en vez de `name` — hace
  // falta cuando el picklist vive fuera de un <form> real, como el panel de
  // creación inline dentro de MaterialSearchInput (que ya está anidado
  // dentro del <form> de MovementForm, así que no puede tener su propio
  // <form>/FormData).
  value?: string;
  onValueChange?: (value: string) => void;
  options: string[];
  placeholder: string;
  addEndpoint: string;
  addLabel: string;
  required?: boolean;
  defaultValue?: string;
}) {
  const [localOptions, setLocalOptions] = useState(options);
  const [mode, setMode] = useState<"select" | "add">("select");
  const [internalSelected, setInternalSelected] = useState(defaultValue);
  const selected = value !== undefined ? value : internalSelected;
  const setSelected = onValueChange ?? setInternalSelected;
  const [newValue, setNewValue] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleAdd() {
    const value = newValue.trim();
    if (!value) return;
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(addEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: value }),
        });
        if (!res.ok) {
          setError("No se pudo agregar");
          return;
        }
        setLocalOptions((prev) =>
          prev.includes(value) ? prev : [...prev, value].sort((a, b) => a.localeCompare(b))
        );
        setSelected(value);
        setMode("select");
        setNewValue("");
      } catch {
        setError("No se pudo agregar. Verifica tu conexión.");
      }
    });
  }

  if (mode === "add") {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder={addLabel}
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            autoFocus
            className={inputClass}
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={pending}
            className="shrink-0 rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background disabled:opacity-50"
          >
            {pending ? "..." : "Agregar"}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("select");
              setNewValue("");
              setError(null);
            }}
            className="shrink-0 rounded-md px-3 py-2 text-sm font-medium"
          >
            Cancelar
          </button>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <select
      name={name}
      required={required}
      value={selected}
      onChange={(e) => {
        if (e.target.value === "__add__") {
          setMode("add");
          return;
        }
        setSelected(e.target.value);
      }}
      className={inputClass}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {localOptions.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
      <option value="__add__">+ {addLabel}</option>
    </select>
  );
}
