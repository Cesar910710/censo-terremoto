-- AlterTable
ALTER TABLE "InventoryMovement" ADD COLUMN     "deliveryId" TEXT;

-- CreateIndex
CREATE INDEX "InventoryMovement_deliveryId_idx" ON "InventoryMovement"("deliveryId");
