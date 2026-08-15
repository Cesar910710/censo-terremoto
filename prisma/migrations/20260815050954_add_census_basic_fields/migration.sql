/*
  Warnings:

  - You are about to drop the column `headOfHouseholdDocId` on the `Family` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('CC', 'TI', 'CE', 'PA', 'RC', 'PEP');

-- AlterTable
ALTER TABLE "Family" DROP COLUMN "headOfHouseholdDocId",
ADD COLUMN     "department" TEXT DEFAULT 'Valle del Cauca',
ADD COLUMN     "documentNumber" TEXT,
ADD COLUMN     "documentType" "DocumentType",
ALTER COLUMN "municipality" SET DEFAULT 'Versalles';

-- CreateTable
CREATE TABLE "Municipio" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "department" TEXT NOT NULL,

    CONSTRAINT "Municipio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_FamilyMaterialsNeeded" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_FamilyMaterialsNeeded_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Municipio_name_department_key" ON "Municipio"("name", "department");

-- CreateIndex
CREATE INDEX "_FamilyMaterialsNeeded_B_index" ON "_FamilyMaterialsNeeded"("B");

-- AddForeignKey
ALTER TABLE "_FamilyMaterialsNeeded" ADD CONSTRAINT "_FamilyMaterialsNeeded_A_fkey" FOREIGN KEY ("A") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FamilyMaterialsNeeded" ADD CONSTRAINT "_FamilyMaterialsNeeded_B_fkey" FOREIGN KEY ("B") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;
