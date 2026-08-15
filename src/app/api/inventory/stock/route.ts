import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Stock actual = suma de ENTRADA - suma de SALIDA, calculado siempre desde el
// ledger (nunca desde un contador guardado), así el offline sync nunca puede
// dejar el stock en un estado inconsistente.
export async function GET() {
  const materials = await prisma.material.findMany({
    include: {
      movements: {
        select: { type: true, quantity: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const stock = materials.map((m) => {
    const entradas = m.movements
      .filter((mv) => mv.type === "ENTRADA")
      .reduce((sum, mv) => sum + mv.quantity, 0);
    const salidas = m.movements
      .filter((mv) => mv.type === "SALIDA")
      .reduce((sum, mv) => sum + mv.quantity, 0);
    return {
      materialId: m.id,
      name: m.name,
      unit: m.unit,
      category: m.category,
      entradas,
      salidas,
      disponible: entradas - salidas,
    };
  });

  return NextResponse.json(stock);
}
