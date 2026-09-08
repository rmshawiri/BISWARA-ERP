/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomUUID } from "node:crypto";

// Charge .env.local (connexion DB réelle) si présent, sinon on skippe.
let HAS_REAL_DB = false;
try {
  const { loadEnvFile } = await import("node:process");
  loadEnvFile(".env.local");
  HAS_REAL_DB = !!process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("placeholder");
} catch {
  HAS_REAL_DB = false;
}

// Imports dynamiques : doivent s'exécuter après le chargement des env.
describe.skipIf(!HAS_REAL_DB)("PERSISTANCE MULTI-TENANT — couche service (réelle)", () => {
  let db: any, organizations: any, profiles: any;
  let catalog: any, crm: any, stock: any;
  let eq: any, and: any;
  let orgA: any, orgB: any;
  let userAId: string, userBId: string;

  const perms = new Set(["view", "create", "update", "delete", "validate", "export", "import", "print", "share", "configure"]);
  const makeCtx = (org: any, userId: string, userName: string) => ({
    user: {
      id: userId,
      username: userName,
      fullName: userName,
      email: `${userName}@biswara.test`,
      role: "admin",
      organizationId: org.id,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    organization: { ...org, plan: "free", status: "active" },
    superAdmin: false,
    permissions: new Map(["catalog", "crm", "stock", "sales"].map((m) => [m, perms])),
  });

  beforeAll(async () => {
    db = (await import("@/db")).db;
    ({ organizations, profiles } = await import("@/db/schema"));
    ({ eq, and } = await import("drizzle-orm"));
    catalog = await import("@/modules/catalog/service");
    crm = await import("@/modules/crm/service");
    stock = await import("@/modules/stock/service");

    const stamp = randomUUID().slice(0, 8);
    const [a] = await db().insert(organizations).values({
      name: `Persist A ${stamp}`, sector: "commerce", country: "KM", plan: "free", status: "active",
    }).returning();
    const [b] = await db().insert(organizations).values({
      name: `Persist B ${stamp}`, sector: "restaurant", country: "KM", plan: "free", status: "active",
    }).returning();
    orgA = a; orgB = b;

    // profiles.id référence auth.users : il faut créer de vrais comptes Auth.
    const admin = (await import("@/lib/supabase/admin")).createAdminClient();
    const createdA = await admin.auth.admin.createUser({
      email: `pa${stamp}@biswara.test`, password: "Test@2026", email_confirm: true,
    });
    const createdB = await admin.auth.admin.createUser({
      email: `pb${stamp}@biswara.test`, password: "Test@2026", email_confirm: true,
    });
    if (createdA.error || createdB.error) throw new Error(createdA.error?.message || createdB.error?.message);
    userAId = createdA.data.user.id;
    userBId = createdB.data.user.id;

    await db().insert(profiles).values({
      id: userAId, username: `pa${stamp}`, fullName: "Persist Admin A", email: `pa${stamp}@biswara.test`,
      role: "admin", organizationId: orgA.id, status: "active",
    });
    await db().insert(profiles).values({
      id: userBId, username: `pb${stamp}`, fullName: "Persist Admin B", email: `pb${stamp}@biswara.test`,
      role: "admin", organizationId: orgB.id, status: "active",
    });
  });

  afterAll(async () => {
    try {
      await db().delete(profiles).where(eq(profiles.id, userAId));
      await db().delete(profiles).where(eq(profiles.id, userBId));
      await db().delete(organizations).where(eq(organizations.id, orgA.id));
      await db().delete(organizations).where(eq(organizations.id, orgB.id));
      const admin = (await import("@/lib/supabase/admin")).createAdminClient();
      await admin.auth.admin.deleteUser(userAId);
      await admin.auth.admin.deleteUser(userBId);
    } catch (e) {
      console.warn("[cleanup]", (e as Error).message);
    }
  });

  it("CRÉE un produit, un client et un dépôt dans l'org A, puis les relit", async () => {
    const ctxA = makeCtx(orgA, userAId, "Persist Admin A");
    const ref = `REF-${randomUUID().slice(0, 8)}`;

    const prod = await catalog.createProduct(ctxA, {
      organizationId: orgA.id, name: "Produit Persist A", reference: ref, purchasePrice: 100, salePrice: 150,
    });
    expect(prod.ok).toBe(true);
    const prodId = prod.data?.id;

    const cust = await crm.createCustomer(ctxA, {
      organizationId: orgA.id, lastname: "Client Persist", type: "customer", firstname: "Test", country: "KM",
    });
    expect(cust.ok).toBe(true);
    const custId = cust.data?.id;

    const wh = await stock.createWarehouse(ctxA, {
      organizationId: orgA.id, name: "Dépôt Persist A", code: `DP-${randomUUID().slice(0, 6)}`,
    });
    expect(wh.ok).toBe(true);
    const whId = wh.data?.id;

    const prods = await catalog.listProducts(ctxA, { search: ref });
    expect(prods.ok).toBe(true);
    expect(prods.data?.some((p: any) => p.id === prodId)).toBe(true);

    const custs = await crm.listCustomers(ctxA, { search: "Client Persist" });
    expect(custs.ok).toBe(true);
    expect(custs.data?.some((c: any) => c.id === custId)).toBe(true);

    const whs = await stock.listWarehouses(ctxA);
    expect(whs.ok).toBe(true);
    expect(whs.data?.some((w: any) => w.id === whId)).toBe(true);
  });

  it("MODIFIE un produit (update) et vérifie la persistance de la modification", async () => {
    const ctxA = makeCtx(orgA, userAId, "Persist Admin A");
    const ref = `REF-U-${randomUUID().slice(0, 8)}`;
    const created = await catalog.createProduct(ctxA, {
      organizationId: orgA.id, name: "Avant MAJ", reference: ref, purchasePrice: 10, salePrice: 20,
    });
    expect(created.ok).toBe(true);

    const updated = await catalog.updateProduct(ctxA, created.data.id, { salePrice: 9999 });
    expect(updated.ok).toBe(true);
    expect(updated.data?.salePrice).toBe(9999);

    const reread = await catalog.listProducts(ctxA, { search: ref });
    expect(reread.ok).toBe(true);
    expect(reread.data?.[0]?.salePrice).toBe(9999);
  });

  it("ISOLATION : l'org B ne voit ni ne modifie les données de l'org A", async () => {
    const ctxA = makeCtx(orgA, userAId, "Persist Admin A");
    const ctxB = makeCtx(orgB, userBId, "Persist Admin B");
    const ref = `REF-ISO-${randomUUID().slice(0, 8)}`;

    const prod = await catalog.createProduct(ctxA, {
      organizationId: orgA.id, name: "Produit Isolé A", reference: ref, purchasePrice: 1, salePrice: 2,
    });
    expect(prod.ok).toBe(true);

    const prodsB = await catalog.listProducts(ctxB, { search: ref });
    expect(prodsB.ok).toBe(true);
    expect(prodsB.data?.length ?? 0).toBe(0);

    const updB = await catalog.updateProduct(ctxB, prod.data.id, { salePrice: 777 });
    expect(updB.ok).toBe(false);
  });

  it("CRÉE une opportunité liée à un client de l'org (FK org validée)", async () => {
    const ctxA = makeCtx(orgA, userAId, "Persist Admin A");
    const ref = `OP-${randomUUID().slice(0, 8)}`;
    const cust = await crm.createCustomer(ctxA, {
      organizationId: orgA.id, lastname: `Opportunite ${ref}`, type: "prospect", firstname: "X", country: "KM",
    });
    expect(cust.ok).toBe(true);

    const opp = await crm.createOpportunity(ctxA, { customerId: cust.data.id, title: `Opportunite ${ref}`, value: 5000 });
    expect(opp.ok).toBe(true);
    expect(opp.data?.customerId).toBe(cust.data.id);
    expect(opp.data?.stage).toBe("prospect");
  });

  it("REST (service_role) lit les mêmes organisations que Drizzle (cohérence REST↔Drizzle)", async () => {
    const admin = (await import("@/lib/supabase/admin")).createAdminClient();
    const { data } = await admin.from("organizations").select("id").eq("name", orgA.name);
    expect(data?.length ?? 0).toBeGreaterThanOrEqual(1);
    expect(data?.some((o: any) => o.id === orgA.id)).toBe(true);
  });
});
