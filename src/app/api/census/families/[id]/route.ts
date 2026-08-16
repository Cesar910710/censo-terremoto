import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { familySchema } from "@/lib/validation";

const familyUpdateSchema = familySchema.omit({ id: true, selfRegistered: true });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const parsed = familyUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { materialsNeeded, ...data } = parsed.data;

  try {
    const family = await prisma.family.update({
      where: { id },
      data: {
        ...data,
        // set (no connect) reemplaza la lista completa — así los materiales
        // que se desmarcaron al editar quedan realmente fuera, no solo sin
        // agregarse los nuevos.
        materialsNeeded: { set: (materialsNeeded ?? []).map((materialId) => ({ id: materialId })) },
      },
    });
    return NextResponse.json(family);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ error: "Beneficiario no encontrado" }, { status: 404 });
    }
    throw err;
  }
}
