import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { materialCategorySchema } from "@/lib/validation";

export async function GET() {
  const categories = await prisma.materialCategory.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = materialCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // upsert por nombre (no create): si alguien intenta agregar una categoría
  // que ya existe, la reutiliza en vez de fallar por el unique constraint.
  const category = await prisma.materialCategory.upsert({
    where: { name: parsed.data.name },
    update: {},
    create: { name: parsed.data.name },
  });

  return NextResponse.json(category, { status: 201 });
}
