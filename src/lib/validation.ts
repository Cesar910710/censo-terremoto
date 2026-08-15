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
});

export const familySchema = z.object({
  id: z.string().uuid().optional(),
  headOfHouseholdName: z.string().min(1, "Nombre requerido"),
  documentType: z.enum(["CC", "TI", "CE", "PA", "RC", "PEP"]),
  documentNumber: z.string().min(1, "Número de identificación requerido"),
  phone: z.string().min(1, "Número de contacto requerido"),
  address: z.string().min(1, "Dirección requerida"),
  municipality: z.string().min(1, "Municipio requerido"),
  department: z.string().min(1, "Departamento requerido"),
  materialsNeeded: z.array(z.string().uuid()).min(1, "Selecciona al menos un material"),
  selfRegistered: z.boolean().optional(),
});
