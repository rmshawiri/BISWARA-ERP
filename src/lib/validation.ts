import { z } from "zod";

/** Valide qu'une chaîne est bien un email. */
export function isEmail(value: string): boolean {
  return z.string().email().safeParse(value).success;
}

/** Schéma de connexion (identifiant = email OU nom d'utilisateur). */
export const loginSchema = z.object({
  identifier: z.string().min(1, "Identifiant requis"),
  password: z.string().min(8, "Mot de passe trop court"),
});

export type LoginInput = z.infer<typeof loginSchema>;

/** Schéma d'inscription (conversationnel - étape compte). */
export const signupSchema = z.object({
  fullName: z.string().min(2, "Nom complet requis"),
  username: z
    .string()
    .min(3, "Nom d'utilisateur trop court")
    .regex(/^[a-zA-Z0-9_]+$/, "Caractères autorisés : lettres, chiffres, _"),
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "8 caractères minimum"),
  passwordConfirm: z.string(),
  organizationName: z.string().min(1, "Nom de l'entreprise requis"),
  sector: z.string().min(1, "Secteur d'activité requis"),
});

export type SignupInput = z.infer<typeof signupSchema>;

/** Politique de mot de passe (exposée au client pour l'UX). */
export const PASSWORD_POLICY = {
  minLength: 8,
  requireUppercase: true,
  requireNumber: true,
};
