/**
 * Événements métier déclenchables par le moteur Webhooks.
 *
 * Ce fichier est volontairement SANS `import "server-only"` : il doit être
 * importable depuis des composants client (formulaire des Paramètres),
 * contrairement au moteur `src/engines/webhook.ts` qui, lui, est serveur.
 */

export const WEBHOOK_EVENTS = [
  { value: "all", label: "Tous les événements" },
  { value: "product.created", label: "Nouveau produit" },
  { value: "customer.created", label: "Nouveau client" },
  { value: "supplier.created", label: "Nouveau fournisseur" },
  { value: "order.created", label: "Nouvelle commande" },
  { value: "invoice.created", label: "Nouvelle facture" },
  { value: "payment.received", label: "Paiement reçu" },
  { value: "employee.created", label: "Employé créé" },
] as const;

export const WEBHOOK_METHODS = ["POST", "PUT", "PATCH"] as const;
