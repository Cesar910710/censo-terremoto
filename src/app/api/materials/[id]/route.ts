import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    await prisma.material.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") {
        return NextResponse.json({ error: "Material no encontrado" }, { status: 404 });
      }
      // P2003: InventoryMovement.materialId es ON DELETE RESTRICT a
      // propósito — nunca se debe poder borrar un material que ya tiene
      // historial de movimientos, para no perder ese ledger.
      if (err.code === "P2003") {
        return NextResponse.json(
          { error: "No se puede eliminar: este material tiene movimientos registrados." },
          { status: 409 }
        );
      }
    }
    throw err;
  }
}
