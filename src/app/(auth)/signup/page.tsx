"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { signupSchema } from "@/lib/validation";
import { createOrganization } from "@/server/signup-actions";
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

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const values = {
      fullName: String(form.get("fullName") ?? ""),
      username: String(form.get("username") ?? ""),
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
      passwordConfirm: String(form.get("passwordConfirm") ?? ""),
      organizationName: String(form.get("organizationName") ?? ""),
      sector: String(form.get("sector") ?? ""),
    };

    if (values.password !== values.passwordConfirm) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }
    const parsed = signupSchema.safeParse(values);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message ?? "Données invalides");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: { username: values.username, full_name: values.fullName },
        },
      });
      if (error) {
        // Compte déjà existant.
        if (String(error.message).toLowerCase().includes("already")) {
          toast.error("Un compte existe déjà avec cet e-mail.");
        } else {
          toast.error(error.message);
        }
        return;
      }
      if (!data.user) {
        toast.info("Vérifiez votre e-mail pour activer votre compte.");
        router.push("/login");
        return;
      }

      // Création de l'organisation + profil (côté serveur, service role).
      const result = await createOrganization({
        authUserId: data.user.id,
        fullName: values.fullName,
        username: values.username,
        email: values.email,
        organizationName: values.organizationName,
        sector: values.sector,
      });

      if (!result.ok) {
        toast.error(result.error ?? "Une erreur est survenue.");
        return;
      }

      toast.success("Espace créé ! Connectez-vous pour commencer.");
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Une erreur est survenue. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-lg">
        <Link href="/" className="mb-8 flex justify-center">
          <BiswaraLogo variant="dark" />
        </Link>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Créer mon espace BISWARA</CardTitle>
            <CardDescription>
              Créez votre organisation en quelques minutes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nom complet</Label>
                  <Input id="fullName" name="fullName" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Nom d'utilisateur</Label>
                  <Input id="username" name="username" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail professionnel</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="organizationName">Nom de l'entreprise</Label>
                  <Input id="organizationName" name="organizationName" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sector">Secteur d'activité</Label>
                  <Input id="sector" name="sector" placeholder="Ex : Commerce" required />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input id="password" name="password" type="password" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passwordConfirm">Confirmation</Label>
                  <Input id="passwordConfirm" name="passwordConfirm" type="password" required />
                </div>
              </div>
              <Button className="w-full" disabled={loading}>
                {loading ? "Création…" : "Créer mon espace"}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Déjà un compte ?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Se connecter
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
