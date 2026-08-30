import { z } from "zod";

export const createProductSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1, "Nom du produit requis"),
  reference: z.string().min(1, "Référence requise"),
  barcode: z.string().optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  brandId: z.string().uuid().optional().nullable(),
  unitId: z.string().uuid().optional().nullable(),
  taxId: z.string().uuid().optional().nullable(),
  description: z.string().optional().nullable(),
  purchasePrice: z.coerce.number().min(0),
  salePrice: z.coerce.number().min(0),
  wholesalePrice: z.coerce.number().min(0).optional().nullable(),
  isService: z.boolean().default(false),
});

export const updateProductSchema = createProductSchema.partial();

export const createCategorySchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1, "Nom de catégorie requis"),
  description: z.string().optional().nullable(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
