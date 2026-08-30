import { z } from "zod";

export const createCustomerSchema = z.object({
  organizationId: z.string().uuid(),
  type: z.enum(["customer", "prospect", "partner"]).default("customer"),
  company: z.string().optional().nullable(),
  firstname: z.string().optional().nullable(),
  lastname: z.string().min(1, "Nom requis"),
  email: z.string().email().optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().default("KM"),
  sector: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
