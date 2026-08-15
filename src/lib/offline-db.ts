import Dexie, { type EntityTable } from "dexie";

export interface CachedMaterial {
  id: string;
  name: string;
  unit: string;
  category: string | null;
}

export type OutboxKind = "material" | "movement" | "family";
export type OutboxStatus = "pending" | "syncing" | "error";

export interface OutboxItem {
  id: string;
  kind: OutboxKind;
  payload: Record<string, unknown>;
  status: OutboxStatus;
  error?: string;
  createdAt: number;
}

export const db = new Dexie("censo-terremoto") as Dexie & {
  materials: EntityTable<CachedMaterial, "id">;
  outbox: EntityTable<OutboxItem, "id">;
};

db.version(1).stores({
  materials: "id, name",
  outbox: "id, kind, status, createdAt",
});
