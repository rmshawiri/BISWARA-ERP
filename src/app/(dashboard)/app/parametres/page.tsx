import type { Metadata } from "next";
import { getAuthzContext } from "@/server/auth";
import { redirect } from "next/navigation";
import { Settings as SettingsIcon, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserSettingsForm } from "@/components/feature/settings/user-settings-form";
import { OrganizationSettingsForm } from "@/components/feature/settings/organization-settings-form";
import { ModulesActivitiesManager } from "@/components/feature/settings/modules-activities";
import { BackupManager } from "@/components/feature/settings/backup-manager";
import {
  listModuleCatalog,
  listOrgModules,
  listActivityCatalog,
  listOrgActivities,
} from "@/modules/activities";

export const metadata: Metadata = { title: "Paramètres" };

export default async function SettingsPage() {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin) redirect("/login");

  const org = ctx.organization;

  const [modulesRes, orgModulesRes, activitiesRes, orgActivitiesRes] =
    await Promise.all([
      listModuleCatalog(ctx),
      listOrgModules(ctx),
      listActivityCatalog(ctx),
      listOrgActivities(ctx),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground">
          Gérez votre profil, votre organisation, vos modules et vos sauvegardes.
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

      {/* Modules & Activités */}
      <ModulesActivitiesManager
        modules={(modulesRes.ok ? modulesRes.data : []).map((m) => ({
          id: m.id,
          name: m.name,
          description: m.description,
        }))}
        orgModules={orgModulesRes.ok ? orgModulesRes.data : []}
        activities={(activitiesRes.ok ? activitiesRes.data : []).map((a) => ({
          id: a.id,
          name: a.name,
          description: a.description,
        }))}
        orgActivities={orgActivitiesRes.ok ? orgActivitiesRes.data : []}
      />

      {/* Sauvegarde */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sauvegarde</CardTitle>
        </CardHeader>
        <CardContent>
          <BackupManager />
        </CardContent>
      </Card>
    </div>
  );
}
