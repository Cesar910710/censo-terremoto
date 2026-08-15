import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { movementSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = movementSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // upsert por id (no create): permite reintentos idempotentes desde la cola
  // offline — si el insert ya había llegado antes de perderse la respuesta,
  // reenviar el mismo id no duplica el movimiento.
  const id = parsed.data.id ?? crypto.randomUUID();

  try {
    const [movement] = await prisma.$transaction([
      prisma.inventoryMovement.upsert({
        where: { id },
        update: {},
        create: { ...parsed.data, id },
      }),
      // Una salida entregada a una familia censada implica que ya se le
      // atendió — se actualiza en la misma transacción para que nunca quede
      // un movimiento registrado sin reflejarse en el estado del censo.
      ...(parsed.data.type === "SALIDA" && parsed.data.familyId
        ? [
            prisma.family.update({
              where: { id: parsed.data.familyId },
              data: { reviewStatus: "ATENDIDO" },
            }),
          ]
        : []),
    ]);
    return NextResponse.json(movement, { status: 201 });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      (err.code === "P2003" || err.code === "P2025")
    ) {
      return NextResponse.json(
        { error: "Material o familia no encontrados" },
        { status: 400 }
      );
    }
    throw err;
  }
}
