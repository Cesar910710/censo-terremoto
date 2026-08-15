import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { materialSchema } from "@/lib/validation";

export async function GET() {
  const materials = await prisma.material.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(materials);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = materialSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const material = await prisma.material.upsert({
    where: { name_unit: { name: parsed.data.name, unit: parsed.data.unit } },
    update: {},
    create: parsed.data,
  });

  return NextResponse.json(material, { status: 201 });
}
