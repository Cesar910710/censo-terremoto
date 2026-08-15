import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { familySchema } from "@/lib/validation";

// Buscador de familias censadas (usado por el campo "Familia / persona que
// recibe" en el formulario de movimientos de inventario).
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json([]);
  }

  const families = await prisma.family.findMany({
    where: { headOfHouseholdName: { contains: q, mode: "insensitive" } },
    select: { id: true, headOfHouseholdName: true, documentNumber: true, municipality: true },
    orderBy: { headOfHouseholdName: "asc" },
    take: 10,
  });

  return NextResponse.json(families);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = familySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { materialsNeeded, id: bodyId, ...data } = parsed.data;
  // upsert por id (no create): permite reintentos idempotentes desde la cola
  // offline — si el insert ya había llegado antes de perderse la respuesta,
  // reenviar el mismo id no duplica la familia.
  const id = bodyId ?? crypto.randomUUID();

  const family = await prisma.family.upsert({
    where: { id },
    update: {},
    create: {
      id,
      ...data,
      materialsNeeded: { connect: materialsNeeded.map((materialId) => ({ id: materialId })) },
    },
  });

  return NextResponse.json(family, { status: 201 });
}
