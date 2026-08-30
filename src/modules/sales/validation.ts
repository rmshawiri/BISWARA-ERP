import { z } from "zod";

export const salesLineSchema = z.object({
  productId: z.string().uuid().optional().nullable(),
  description: z.string().min(1),
  quantity: z.coerce.number().min(0),
  unitPrice: z.coerce.number().min(0),
  taxRate: z.coerce.number().min(0).default(0),
});

export const createSalesDocumentSchema = z.object({
  organizationId: z.string().uuid(),
  type: z.enum(["quote", "order", "delivery", "invoice", "credit_note"]),
  customerId: z.string().uuid().optional().nullable(),
  date: z.string().optional(),
  validUntil: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  discount: z.coerce.number().min(0).default(0),
  notes: z.string().optional().nullable(),
  lines: z.array(salesLineSchema).min(1, "Au moins une ligne"),
});

export type SalesLineInput = z.infer<typeof salesLineSchema>;
export type CreateSalesDocumentInput = z.infer<typeof createSalesDocumentSchema>;

export interface ComputedTotals {
  subtotal: number;
  taxTotal: number;
  discount: number;
  total: number;
}

/** Calcule les totaux d'un document à partir de ses lignes. */
export function computeTotals(
  lines: SalesLineInput[],
  discount = 0
): ComputedTotals {
  let subtotal = 0;
  let taxTotal = 0;
  for (const l of lines) {
    const lineBeforeTax = l.quantity * l.unitPrice;
    subtotal += lineBeforeTax;
    taxTotal += lineBeforeTax * l.taxRate;
  }
  const total = subtotal + taxTotal - discount;
  return { subtotal, taxTotal, discount, total };
}
