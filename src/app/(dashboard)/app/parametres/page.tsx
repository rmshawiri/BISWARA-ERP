import type { Metadata } from "next";
import { getAuthzContext } from "@/server/auth";
import { redirect } from "next/navigation";
import { Settings as SettingsIcon, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserSettingsForm } from "@/components/feature/settings/user-settings-form";
import { OrganizationSettingsForm } from "@/components/feature/settings/organization-settings-form";
import { ModulesActivitiesManager } from "@/components/feature/settings/modules-activities";
import { BackupManager } from "@/components/feature/settings/backup-manager";
import { AdvancedSettings } from "@/components/feature/settings/advanced-settings";
import {
  listModuleCatalog,
  listOrgModules,
  listActivityCatalog,
  listOrgActivities,
} from "@/modules/activities";
import {
  listCurrencies,
  listPaymentMethods,
  listApiKeys,
  listWebhooks,
  listWebhookDeliveries,
} from "@/modules/advanced";
import type { Currency, PaymentMethod, ApiKey, Webhook, WebhookDelivery } from "@/db/schema";

export const metadata: Metadata = { title: "Paramètres" };

export default async function SettingsPage() {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin) redirect("/login");

  const org = ctx.organization;

  const [modulesRes, orgModulesRes, activitiesRes, orgActivitiesRes, currenciesRes, paymentMethodsRes, apiKeysRes, webhooksRes, webhookDeliveriesRes] =
    await Promise.all([
      listModuleCatalog(ctx),
      listOrgModules(ctx),
      listActivityCatalog(ctx),
      listOrgActivities(ctx),
      listCurrencies(ctx),
      listPaymentMethods(ctx),
      listApiKeys(ctx),
      listWebhooks(ctx),
      listWebhookDeliveries(ctx),
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

      {/* Fonctionnalités avancées */}
      <h2 className="text-lg font-bold">Fonctionnalités avancées</h2>
      <AdvancedSettings
        currencies={(currenciesRes.ok ? currenciesRes.data : []).map((c) => ({ id: c.id, code: c.code, name: c.name, rateToKmf: Number(c.rateToKmf), isDefault: c.isDefault }))}
        paymentMethods={(paymentMethodsRes.ok ? paymentMethodsRes.data : []).map((m) => ({ id: m.id, name: m.name, code: m.code, active: m.active }))}
        apiKeys={(apiKeysRes.ok ? apiKeysRes.data : []).map((k) => ({ id: k.id, label: k.label, keyText: k.keyText, active: k.active }))}
        webhooks={(webhooksRes.ok ? webhooksRes.data : []).map((w) => ({ id: w.id, event: w.event, url: w.url, name: w.name, method: w.method, active: w.active, lastDeliveryAt: w.lastDeliveryAt ? w.lastDeliveryAt.toISOString() : null, deliveryCount: Number(w.deliveryCount ?? 0) }))}
        webhookDeliveries={(webhookDeliveriesRes.ok ? webhookDeliveriesRes.data : []).map((d) => ({ id: d.id, event: d.event, url: d.url, method: d.method, status: d.status, statusCode: d.statusCode ? Number(d.statusCode) : null, statusText: d.response, durationMs: d.durationMs ? Number(d.durationMs) : null, createdAt: d.createdAt.toISOString() }))}
      />
    </div>
  );
}
