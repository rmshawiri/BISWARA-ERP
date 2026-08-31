import type { Metadata } from "next";
import { getAuthzContext } from "@/server/auth";
import { redirect } from "next/navigation";
import { Settings as SettingsIcon, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserSettingsForm } from "@/components/feature/settings/user-settings-form";
import { OrganizationSettingsForm } from "@/components/feature/settings/organization-settings-form";

export const metadata: Metadata = { title: "Paramètres" };

export default async function SettingsPage() {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin) redirect("/login");

  const org = ctx.organization;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground">
          Gérez votre profil, votre organisation et vos préférences.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profil */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <SettingsIcon className="h-4 w-4" />
              Mon profil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <UserSettingsForm
              initial={{
                fullName: ctx.user.fullName,
                phone: "",
                email: ctx.user.email ?? "",
              }}
            />
          </CardContent>
        </Card>

        {/* Organisation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" />
              Organisation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {org ? (
              <OrganizationSettingsForm
                initial={{
                  name: org.name,
                  slogan: org.slogan ?? "",
                  city: org.city ?? "",
                  currency: org.currency,
                  country: org.country,
                }}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucune organisation associée.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
