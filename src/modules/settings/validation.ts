import { z } from "zod";

export const updateOrganizationSchema = z.object({
  name: z.string().min(2, "Nom trop court"),
  slogan: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  currency: z.string().min(3).max(8, "Devise invalide"),
  country: z.string().min(2).max(2, "Code pays (2 lettres)"),
});

export const updateUserSchema = z.object({
  fullName: z.string().min(2, "Nom trop court"),
  phone: z.string().optional().nullable(),
});

export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
