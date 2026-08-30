import { z } from "zod";

export const createWarehouseSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1, "Nom du dépôt requis"),
  code: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
});

export const createStockMovementSchema = z.object({
  organizationId: z.string().uuid(),
  productId: z.string().uuid(),
  warehouseId: z.string().uuid().optional().nullable(),
  type: z.enum(["in", "out", "transfer", "adjust", "inventory"]),
  quantity: z.coerce.number().min(0),
  reference: z.string().optional().nullable(),
  date: z.string().optional(),
  notes: z.string().optional().nullable(),
});

export type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>;
export type CreateStockMovementInput = z.infer<typeof createStockMovementSchema>;
