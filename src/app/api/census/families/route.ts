import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { familySchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = familySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { materialsNeeded, ...data } = parsed.data;

  const family = await prisma.family.create({
    data: {
      ...data,
      materialsNeeded: { connect: materialsNeeded.map((id) => ({ id })) },
    },
  });

  return NextResponse.json(family, { status: 201 });
}
