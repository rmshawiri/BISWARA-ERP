"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { resolveIdentifier } from "@/server/auth-actions";
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

      // Résout l'identifiant (email ou nom d'utilisateur) vers l'email.
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

      // Redirige selon le rôle (Super Admin => /admin, sinon /app).
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user?.id)
        .single();

      toast.success("Connexion réussie");
      if (profile?.role === "super_admin") {
        router.push("/admin");
      } else {
        router.push("/app");
      }
      router.refresh();
    } catch {
      toast.error("Une erreur est survenue. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex justify-center">
          <BiswaraLogo />
        </Link>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Connexion</CardTitle>
            <CardDescription>
              Connectez-vous à votre espace BISWARA.
            </CardDescription>
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
                  <Link
                    href="/mot-de-passe-oublie"
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </div>
              <Button className="w-full" disabled={loading}>
                {loading ? "Connexion…" : "Se connecter"}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Pas encore de compte ?{" "}
              <Link href="/signup" className="font-medium text-primary hover:underline">
                Créer mon espace BISWARA
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
