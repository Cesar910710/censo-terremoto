import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { CATEGORIAS, TODOS_LOS_MATERIALES } from "../src/lib/materiales.constants";
import { MUNICIPIOS_VALLE_DEL_CAUCA } from "../src/lib/municipios.constants";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const nombreCategoria = new Map(CATEGORIAS.map((c) => [c.codigo, c.nombre]));

async function seedMateriales() {
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

async function seedMunicipios() {
  for (const name of MUNICIPIOS_VALLE_DEL_CAUCA) {
    await prisma.municipio.upsert({
      where: { name_department: { name, department: "Valle del Cauca" } },
      update: {},
      create: { name, department: "Valle del Cauca" },
    });
  }
  console.log(`Seed listo: ${MUNICIPIOS_VALLE_DEL_CAUCA.length} municipios.`);
}

async function main() {
  await seedMateriales();
  await seedMunicipios();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
