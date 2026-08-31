import { z } from "zod";

export const createSupplierSchema = z.object({
  name: z.string().min(1, "Nom du fournisseur requis"),
  reference: z.string().optional().nullable(),
  contact: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email("E-mail invalide").optional().nullable(),
});

export const purchaseLineSchema = z.object({
  description: z.string().min(1, "Description requise"),
  quantity: z.coerce.number().min(0),
  unitPrice: z.coerce.number().min(0),
});

export const createPurchaseDocumentSchema = z.object({
  supplierId: z.string().uuid(),
  type: z.enum(["request", "order"]),
  date: z.string().optional().nullable(),
  lines: z.array(purchaseLineSchema).min(1, "Au moins une ligne"),
});

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type CreatePurchaseDocumentInput = z.infer<typeof createPurchaseDocumentSchema>;
export type PurchaseLineInput = z.infer<typeof purchaseLineSchema>;
