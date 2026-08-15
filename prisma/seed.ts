import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { CATEGORIAS, TODOS_LOS_MATERIALES } from "../src/lib/materiales.constants";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const nombreCategoria = new Map(CATEGORIAS.map((c) => [c.codigo, c.nombre]));

async function main() {
  for (const material of TODOS_LOS_MATERIALES) {
    await prisma.material.upsert({
      where: { name_unit: { name: material.nombre, unit: material.unidad } },
      update: {},
      create: {
        name: material.nombre,
        unit: material.unidad,
        category: nombreCategoria.get(material.categoria) ?? material.categoria,
      },
    });
  }
  console.log(`Seed listo: ${TODOS_LOS_MATERIALES.length} materiales.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
