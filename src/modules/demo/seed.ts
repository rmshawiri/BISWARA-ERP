import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

const DEMO_CATEGORIES = [
  { name: "Alimentation", description: "Produits alimentaires" },
  { name: "Boissons", description: "Boissons et rafraîchissements" },
  { name: "Entretien", description: "Produits d'entretien" },
];

const DEMO_PRODUCTS = [
  { name: "Riz parfumé 5kg", reference: "RF-5KG", salePrice: 8500, purchasePrice: 7000, category: "Alimentation", isService: false },
  { name: "Huile végétale 1L", reference: "HU-1L", salePrice: 3200, purchasePrice: 2700, category: "Alimentation", isService: false },
  { name: "Coca-Cola 1.5L", reference: "COCA-15", salePrice: 1500, purchasePrice: 1100, category: "Boissons", isService: false },
  { name: "Savon de ménage", reference: "SAV-01", salePrice: 900, purchasePrice: 600, category: "Entretien", isService: false },
];

const DEMO_CUSTOMERS = [
  { type: "customer", lastname: "Hassani", firstname: "Ali", company: "SARL Horizon", email: "client1@example.com", phone: "+2697711122", city: "Moroni" },
  { type: "customer", lastname: "Mohamed", firstname: "Nassur", company: "Boutique Nassur", email: "client2@example.com", phone: "+2697733344", city: "Mutsamudu" },
  { type: "prospect", lastname: "Sofia", firstname: "Anouk", company: "Café de la Plage", email: "client3@example.com", phone: "+2697755566", city: "Fomboni" },
];

/**
 * Génère des données de démonstration pour une organisation nouvellement créée.
 * Best-effort : n'échoue jamais (ne bloque pas l'inscription).
 * Utilise la clé service_role (serveur uniquement).
 */
export async function seedDemoData(organizationId: string): Promise<void> {
  const admin = createAdminClient();
  try {
    // Catégories
    const catByKey: Record<string, string> = {};
    for (const c of DEMO_CATEGORIES) {
      const { data } = await admin
        .from("product_categories")
        .insert({ organization_id: organizationId, name: c.name, description: c.description, active: true })
        .select("id")
        .single();
      if (data) catByKey[c.name] = data.id;
    }

    // Produits
    for (const p of DEMO_PRODUCTS) {
      await admin.from("products").insert({
        organization_id: organizationId,
        name: p.name,
        reference: `${p.reference}-${organizationId.slice(0, 4)}`,
        category_id: catByKey[p.category] ?? null,
        sale_price: p.salePrice,
        purchase_price: p.purchasePrice,
        is_service: p.isService,
        active: true,
      });
    }

    // Clients
    for (const c of DEMO_CUSTOMERS) {
      await admin.from("customers").insert({
        organization_id: organizationId,
        type: c.type,
        lastname: c.lastname,
        firstname: c.firstname,
        company: c.company,
        email: c.email,
        phone: c.phone,
        city: c.city,
        status: "active",
      });
    }

    // Dépôt principal
    await admin
      .from("warehouses")
      .insert({ organization_id: organizationId, name: "Dépôt principal", code: "DEP-01", status: "active" });
  } catch {
    // Best-effort : on ignore si une table manque.
  }
}
