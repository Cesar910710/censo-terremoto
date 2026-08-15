"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/offline-db";
import { syncOutbox } from "@/lib/sync";

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
