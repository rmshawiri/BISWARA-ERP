/**
 * BISWARA ERP — Test d'intégration réel via l'API Supabase (auth + RLS + multi-tenant).
 * Exécution : node --env-file=.env.local supabase/scripts/smoke-test.mjs
 */
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PUB = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const admin = createClient(URL, SECRET, { auth: { persistSession: false } });
const stamp = Date.now().toString().slice(-8);

async function main() {
  console.log("🚀 Smoke test BISWARA (Supabase REST)…");

  // ---- Service role : insert produit (test que la table accepte) ----
  const { data: sOrg } = await admin
    .from("organizations")
    .insert({ name: `Smoke A ${stamp}`, sector: "commerce", country: "KM", plan: "free" })
    .select("id").single();
  console.log("  ✓ Org A:", sOrg.id);
  const sInsert = await admin.from("products").insert({
    organization_id: sOrg.id, name: "Produit A", reference: `REF-${stamp}`, sale_price: 1200,
  });
  if (sInsert.error) throw new Error("service role insert produit: " + sInsert.error.message);
  console.log("  ✓ Insert produit via service role (OK)");

  // ---- Créer un compte admin et vérifier le profil ----
  const emailA = `admina${stamp}@biswara.test`;
  const { data: created, error: cu } = await admin.auth.admin.createUser({
    email: emailA, password: "Test@2026", email_confirm: true,
  });
  if (cu) throw new Error("createUser: " + cu.message);
  const userAId = created?.user?.id;
  if (!userAId) throw new Error("createUser n'a pas retourné d'id");

  const { error: upErr } = await admin.from("profiles").upsert({
    id: userAId, username: `admina${stamp}`, full_name: "Admin A", email: emailA,
    role: "admin", organization_id: sOrg.id, status: "active",
  });
  if (upErr) throw new Error("upsert profil A: " + upErr.message);
  console.log("  ✓ Profil admin A upserté");

  // Vérifier que le profil est lisible
  const { data: prof } = await admin.from("profiles").select("role,organization_id").eq("id", userAId).single();
  console.log("  ✓ Profil A lisible:", prof.role, prof.organization_id);

  // ---- Connexion authentifiée ----
  const clientA = createClient(URL, PUB);
  const { data: session, error: se } = await clientA.auth.signInWithPassword({ email: emailA, password: "Test@2026" });
  if (se) throw new Error("sign-in: " + se.message);
  console.log("  ✓ Connexion admin A (JWT)");

  // ---- Insert produit avec le JWT A (RLS doit autoriser) ----
  const { error: ic } = await clientA.from("products").insert({
    organization_id: sOrg.id, name: "Produit A client", reference: `REFC-${stamp}`, sale_price: 500,
  });
  if (ic) throw new Error("insert produit via JWT A: " + ic.message);
  console.log("  ✓ Insert produit via JWT A (RLS autorise dans l'org)");

  // ---- Isolation : le client A ne doit pas voir/écrire dans une autre org ----
  const { data: orgB } = await admin
    .from("organizations")
    .insert({ name: `Smoke B ${stamp}`, sector: "restaurant", country: "KM", plan: "free" })
    .select("id").single();
  await admin.from("products").insert({ organization_id: orgB.id, name: "Produit B", reference: `REFB-${stamp}`, sale_price: 60 });

  const { data: crossRead } = await clientA.from("products").select("name").eq("reference", `REFB-${stamp}`);
  if (crossRead && crossRead.length > 0) {
    console.log("  ✗ Isolation FAIL: le client A voit le produit de B !");
    process.exitCode = 1;
  } else {
    console.log("  ✓ Isolation OK : le client A ne voit pas le produit de l'org B");
  }

  const { error: crossWrite } = await clientA.from("products").insert({
    organization_id: orgB.id, name: "Hack", reference: "HACK", sale_price: 1,
  });
  if (crossWrite) {
    console.log("  ✓ Isolation OK : écriture cross-org refusée");
  } else {
    console.log("  ✗ Isolation FAIL: écriture cross-org acceptée !");
    process.exitCode = 1;
  }

  console.log("🎉 Smoke test terminé.");
}

main().catch((e) => { console.error("❌ Échec:", e.message); process.exit(1); });
