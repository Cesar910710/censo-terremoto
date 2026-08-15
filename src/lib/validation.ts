import { z } from "zod";

export const materialSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  unit: z.string().min(1, "Unidad requerida"),
  category: z.string().optional(),
});

export const movementSchema = z.object({
  materialId: z.string().uuid(),
  type: z.enum(["ENTRADA", "SALIDA"]),
  quantity: z.number().positive("La cantidad debe ser mayor a 0"),
  note: z.string().optional(),
  donorName: z.string().optional(),
  recipientName: z.string().optional(),
  familyId: z.string().uuid().optional(),
  occurredAt: z.string().datetime().optional(),
});
