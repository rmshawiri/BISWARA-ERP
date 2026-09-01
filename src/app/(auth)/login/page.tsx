"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { resolveIdentifier } from "@/server/auth-actions";
import { logAuthEvent } from "@/server/auth-audit";
import { loginSchema } from "@/lib/validation";
import { BiswaraLogo } from "@/components/brand/biswara-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const identifier = String(form.get("identifier") ?? "");
    const password = String(form.get("password") ?? "");

    const parsed = loginSchema.safeParse({ identifier, password });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message ?? "Données invalides");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const resolved = await resolveIdentifier(identifier);
      if (!resolved.email) {
        toast.error(resolved.error ?? "Identifiant introuvable");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: resolved.email,
        password,
      });
      if (error) {
        toast.error("Identifiants incorrects.");
        return;
      }

      toast.success("Connexion réussie");
      // Journalise la connexion (fire-and-forget).
      logAuthEvent("login");
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user?.id)
          .single();
        if (profile?.role === "super_admin") {
          router.push("/admin");
        } else {
          router.push("/app");
        }
      } catch {
        // Même si le profil ne se charge pas, l'utilisateur est authentifié.
        router.push("/app");
      }
      router.refresh();
    } catch (err) {
      console.error("[login] Erreur inattendue :", err);
      toast.error("Connexion impossible. Vérifiez votre connexion et réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Panneau de marque */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#0A3A7A] via-[#2E86FF] to-[#001D3F] text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute inset-0 opacity-30 [background:radial-gradient(50%_50%_at_80%_10%,rgba(255,255,255,0.4),transparent)]" />
        <Link href="/" className="relative">
          <BiswaraLogo variant="dark" />
        </Link>
        <div className="relative space-y-6">
          <h1 className="max-w-md text-3xl font-bold leading-tight">
            Pilotez votre entreprise depuis une seule plateforme.
          </h1>
          <p className="max-w-sm text-white/80">
            Centralisez votre gestion, automatisez vos tâches et prenez de
            meilleures décisions avec BISWARA ERP OS.
          </p>
          <ul className="space-y-2.5">
            {[
              { icon: Zap, text: "Rapide et moderne" },
              { icon: ShieldCheck, text: "Sécurisé & multi-tenant" },
              { icon: Sparkles, text: "ERP tout-en-un" },
            ].map((f) => (
              <li key={f.text} className="flex items-center gap-3 text-white/90">
                <f.icon className="h-4 w-4 text-biswara-gold-400" />
                <span className="text-sm font-medium">{f.text}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-white/50">
          © {new Date().getFullYear()} BISWARA ERP OS — MORA Shawiri
        </p>
      </div>

      {/* Formulaire */}
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#0A1B3E] via-[#0A1630] to-[#05060f] px-4 py-12">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à l'accueil
          </Link>
          <Link href="/" className="mb-8 flex justify-center lg:hidden">
            <BiswaraLogo variant="dark" />
          </Link>
          <Card className="card-premium">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Connexion</CardTitle>
              <CardDescription>Connectez-vous à votre espace BISWARA.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="identifier">Email ou nom d'utilisateur</Label>
                  <Input
                    id="identifier"
                    name="identifier"
                    placeholder="vous@entreprise.com ou rachade"
                    autoComplete="username"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Mot de passe</Label>
                    <Link href="/mot-de-passe-oublie" className="text-xs text-muted-foreground hover:text-foreground">
                      Oublié ?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button className="w-full" size="lg" disabled={loading}>
                  {loading ? "Connexion…" : "Se connecter"}
                  {!loading && <ArrowRight className="ml-1 h-4 w-4" />}
                </Button>
              </form>
              <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-sm text-muted-foreground">
                Pas encore de compte ?{" "}
                <Link href="/signup" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
                  Créer mon espace <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </p>
              <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-biswara-green-500" />
                Accès sécurisé & chiffré
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
