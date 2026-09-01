/**
 * BISWARA — Règle le Super Admin : identifiant "rachade", mot de passe "rachoums".
 * Utilise l'API Auth Supabase (service role) — fonctionne même si le host DB direct
 * ne résout pas (host REST = https://<project-ref>.supabase.co).
 *
 * Exécution (Windows PowerShell, depuis 02_CODE) :
 *   node scripts/set-superadmin-password.cjs
 */
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

function loadEnv(file) {
  const env = {};
  if (fs.existsSync(file)) {
    for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#") || !t.includes("=")) continue;
      const i = t.indexOf("=");
      env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    }
  }
  return env;
}

const env = loadEnv(path.join(__dirname, "..", ".env.local"));
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = env.SUPABASE_SERVICE_ROLE_KEY;
const WANTED = {
  username: env.SUPER_ADMIN_USERNAME || "rachade",
  password: "rachoums",
  email: env.SUPER_ADMIN_EMAIL || "admin@biswara.app",
};

if (!url || !serviceRole) {
  console.error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquants.");
  process.exit(1);
}

const admin = createClient(url, serviceRole, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log(`🔑 Connexion à l'API Auth... (${url.replace(/^https?:\/\//, "").split(".")[0]})`);

  // 1. Trouver le user auth par email.
  let authUser = null;
  for (let page = 1; page <= 5; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error("listUsers: " + error.message);
    const found = (data?.users ?? []).find((u) => u.email === WANTED.email);
    if (found) { authUser = found; break; }
    if ((data?.users ?? []).length < 1000) break;
  }

  if (authUser) {
    console.log(`Compte existant trouvé (${authUser.email}) — mise à jour du mot de passe.`);
  } else {
    // 2. Créer s'il n'existe pas.
    const { data: created, error: cErr } = await admin.auth.admin.createUser({
      email: WANTED.email,
      password: WANTED.password,
      email_confirm: true,
      user_metadata: { username: WANTED.username, full_name: "MORA Shawiri (Super Admin)" },
    });
    if (cErr) throw new Error("createUser: " + cErr.message);
    authUser = created.user;
    console.log(`Compte créé (${WANTED.email}).`);
  }

  // 3. Forcer le mot de passe à "rachoums".
  const { error: pErr } = await admin.auth.admin.updateUserById(authUser.id, {
    password: WANTED.password,
    email_confirm: true,
  });
  if (pErr) throw new Error("updateUserById: " + pErr.message);

  // 4. Garantir le profil (username = rachade, role = super_admin).
  const { error: profErr } = await admin.from("profiles").upsert(
    {
      id: authUser.id,
      username: WANTED.username,
      full_name: "MORA Shawiri (Super Admin)",
      email: WANTED.email,
      role: "super_admin",
      organization_id: null,
      status: "active",
    },
    { onConflict: "id" }
  );
  if (profErr) throw new Error("profil upsert: " + profErr.message);

  console.log("✅ Super Admin configuré.");
  console.log(`   Identifiant : ${WANTED.username}`);
  console.log("   Mot de passe : rachoums");
  console.log(`   Email : ${WANTED.email}`);
}

main().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
