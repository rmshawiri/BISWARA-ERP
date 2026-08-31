import { describe, it, expect } from "vitest";

const dbUrl = process.env.DATABASE_URL;
const hasRealDb = !!dbUrl && !dbUrl.toLowerCase().includes("placeholder");

// Ces tests d'intégration nécessitent une base réelle (Supabase/Postgres) :
// ils sont ignorés lorsque DATABASE_URL n'est pas configuré pour ne pas casser le CI.
describe.skipIf(!hasRealDb)("intégration base de données (T2)", () => {
  it("peut interroger une table via Drizzle", async () => {
    const { db } = await import("@/db");
    const { organizations } = await import("@/db/schema");
    const rows = await db().select().from(organizations).limit(1);
    expect(Array.isArray(rows)).toBe(true);
  }, 15000);

  it("filtrer par organisation isole les rangées", async () => {
    const { db } = await import("@/db");
    const { organizations } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");
    const rows = await db()
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.id, "00000000-0000-0000-0000-000000000000"));
    expect(rows).toEqual([]);
  }, 15000);
});
