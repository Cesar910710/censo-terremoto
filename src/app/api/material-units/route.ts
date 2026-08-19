import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { materialUnitSchema } from "@/lib/validation";

export async function GET() {
  const units = await prisma.materialUnit.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(units);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = materialUnitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // upsert por nombre (no create): si alguien intenta agregar una unidad
  // que ya existe, la reutiliza en vez de fallar por el unique constraint.
  const unit = await prisma.materialUnit.upsert({
    where: { name: parsed.data.name },
    update: {},
    create: { name: parsed.data.name },
  });

  return NextResponse.json(unit, { status: 201 });
}
