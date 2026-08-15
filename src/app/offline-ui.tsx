"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type OutboxItem } from "@/lib/offline-db";
import { syncOutbox, retryItem, discardItem } from "@/lib/sync";

function subscribeOnline(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

export function SyncStatus() {
  const router = useRouter();
  // useSyncExternalStore: forma correcta de leer una API del navegador de
  // forma reactiva sin desincronizar el render del servidor (que no tiene
  // `navigator`) del primer render del cliente.
  const online = useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true
  );
  const [syncing, setSyncing] = useState(false);
  const pendingCount = useLiveQuery(
    () => db.outbox.where("status").notEqual("error").count(),
    [],
    0
  );
  const errorCount = useLiveQuery(() => db.outbox.where("status").equals("error").count(), [], 0);

  useEffect(() => {
    if (!online) return;
    let cancelled = false;

    async function runSync() {
      setSyncing(true);
      const result = await syncOutbox();
      if (cancelled) return;
      setSyncing(false);
      if (result.syncedCount > 0) router.refresh();
    }

    runSync();
    const interval = setInterval(runSync, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  async function handleManualSync() {
    setSyncing(true);
    const result = await syncOutbox();
    setSyncing(false);
    if (result.syncedCount > 0) router.refresh();
  }

  if (pendingCount === 0 && errorCount === 0 && online) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border border-black/[.08] bg-zinc-50 px-3 py-2 text-sm dark:border-white/[.145] dark:bg-zinc-900">
      <span className={online ? "text-zinc-600 dark:text-zinc-400" : "font-medium text-red-600"}>
        {online ? "En línea" : "Sin conexión"}
      </span>
      {pendingCount > 0 && <span>{pendingCount} pendiente(s) de sincronizar</span>}
      {errorCount > 0 && <span className="text-red-600">{errorCount} con error</span>}
      <button
        type="button"
        onClick={handleManualSync}
        disabled={syncing || !online}
        className="ml-auto text-xs font-medium underline disabled:opacity-50"
      >
        {syncing ? "Sincronizando..." : "Sincronizar ahora"}
      </button>
    </div>
  );
}

const kindLabel: Record<OutboxItem["kind"], string> = {
  material: "Material nuevo",
  movement: "Movimiento",
  family: "Familia",
};

const statusLabel: Record<OutboxItem["status"], string> = {
  pending: "Pendiente de sincronizar",
  syncing: "Sincronizando...",
  error: "Error al sincronizar",
};

function itemDetail(item: OutboxItem): string {
  if (item.kind === "material") return ` — ${item.payload.name}`;
  if (item.kind === "family") return ` — ${item.payload.headOfHouseholdName}`;
  return "";
}

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
              {itemDetail(item)}
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
