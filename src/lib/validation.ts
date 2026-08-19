import { z } from "zod";

export const materialSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Nombre requerido"),
  unit: z.string().min(1, "Unidad requerida"),
  category: z.string().optional(),
});

export const movementSchema = z.object({
  id: z.string().uuid().optional(),
  materialId: z.string().uuid(),
  type: z.enum(["ENTRADA", "SALIDA"]),
  quantity: z.number().positive("La cantidad debe ser mayor a 0"),
  note: z.string().optional(),
  donorName: z.string().optional(),
  recipientName: z.string().optional(),
  familyId: z.string().uuid().optional(),
  occurredAt: z.string().datetime().optional(),
  deliveryId: z.string().uuid().optional(),
});

export const materialCategorySchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
});

export const materialUnitSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
});

export const familySchema = z.object({
  id: z.string().uuid().optional(),
  headOfHouseholdName: z.string().min(1, "Nombre requerido"),
  documentType: z.enum(["CC", "TI", "CE", "PA", "RC", "PEP"]).optional(),
  documentNumber: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  municipality: z.string().optional(),
  department: z.string().optional(),
  materialsNeeded: z.array(z.string().uuid()).optional(),
  selfRegistered: z.boolean().optional(),
});
