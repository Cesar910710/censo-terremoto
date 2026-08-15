import { db, type OutboxItem, type OutboxKind } from "./offline-db";

const endpoints: Record<OutboxKind, string> = {
  material: "/api/materials",
  movement: "/api/inventory/movements",
};

export async function enqueue(kind: OutboxKind, payload: Record<string, unknown>) {
  const id = (payload.id as string | undefined) ?? crypto.randomUUID();
  const item: OutboxItem = {
    id,
    kind,
    payload: { ...payload, id },
    status: "pending",
    createdAt: Date.now(),
  };
  await db.outbox.add(item);
  return item;
}

function extractErrorMessage(body: unknown): string {
  if (body && typeof body === "object" && "error" in body) {
    const err = (body as { error: unknown }).error;
    if (err && typeof err === "object" && "fieldErrors" in err) {
      const fieldErrors = (err as { fieldErrors: Record<string, string[]> }).fieldErrors;
      return Object.values(fieldErrors).flat().join(", ") || "Error al sincronizar";
    }
    if (typeof err === "string") return err;
  }
  return "Error al sincronizar";
}

async function syncItem(item: OutboxItem): Promise<{ ok: boolean; data?: { id: string } }> {
  await db.outbox.update(item.id, { status: "syncing" });
  try {
    const res = await fetch(endpoints[item.kind], {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item.payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      await db.outbox.update(item.id, { status: "error", error: extractErrorMessage(body) });
      return { ok: false };
    }
    const data = (await res.json()) as { id: string };
    await db.outbox.delete(item.id);
    return { ok: true, data };
  } catch {
    // sin conexión (o se cortó a mitad de la petición) — se queda pendiente,
    // se reintenta en la próxima pasada de sync, no se pierde.
    await db.outbox.update(item.id, { status: "pending" });
    return { ok: false };
  }
}

export async function syncOutbox() {
  let syncedCount = 0;

  // Los materiales van primero: si un material creado offline resulta ser
  // duplicado de uno que ya existía (mismo nombre+unidad), el servidor lo
  // fusiona y devuelve OTRO id. Cualquier movimiento en cola que apuntaba al
  // id local hay que reescribirlo antes de intentar sincronizar movimientos.
  const materialItems = await db.outbox.where("kind").equals("material").toArray();
  for (const item of materialItems) {
    const result = await syncItem(item);
    if (result.ok) {
      syncedCount++;
      const canonicalId = result.data?.id;
      if (canonicalId && canonicalId !== item.id) {
        await db.outbox
          .where("kind")
          .equals("movement")
          .modify((mv) => {
            if (mv.payload.materialId === item.id) mv.payload.materialId = canonicalId;
          });
      }
    }
  }

  const movementItems = await db.outbox.where("kind").equals("movement").toArray();
  for (const item of movementItems) {
    const result = await syncItem(item);
    if (result.ok) syncedCount++;
  }

  return { syncedCount };
}

export async function retryItem(id: string) {
  const item = await db.outbox.get(id);
  if (item) await syncItem(item);
}

export async function discardItem(id: string) {
  await db.outbox.delete(id);
}
