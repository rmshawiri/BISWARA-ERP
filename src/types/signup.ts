/** Entrée pour la création d'une organisation (inscription). */
export interface ResolvedSignup {
  authUserId: string;
  fullName: string;
  username: string;
  email: string;
  organizationName: string;
  sector: string;
}
