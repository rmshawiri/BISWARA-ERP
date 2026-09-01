import type { Metadata } from "next";
import { getAuthzContext } from "@/server/auth";
import { redirect } from "next/navigation";
import { listModuleCatalog, listActivityCatalog } from "@/modules/activities";
import { OnboardingWizard } from "@/components/feature/onboarding/onboarding-wizard";
import { BiswaraLogo } from "@/components/brand/biswara-logo";

export const metadata: Metadata = { title: "Bienvenue — BISWARA" };
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const ctx = await getAuthzContext();
  if (!ctx) redirect("/login");
  if (ctx.superAdmin) redirect("/admin");
  if (!ctx.organization) redirect("/login");

  const [modulesRes, activitiesRes] = await Promise.all([
    listModuleCatalog(ctx),
    listActivityCatalog(ctx),
  ]);

  return (
    <div className="dark relative flex min-h-screen flex-col items-center justify-center bg-[#05060f] px-4 py-12 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(60%_50%_at_50%_-10%,rgba(46,134,255,0.35),transparent),radial-gradient(50%_40%_at_100%_100%,rgba(34,211,238,0.15),transparent)]" />
      <div className="relative mb-8">
        <BiswaraLogo variant="dark" />
      </div>
      <OnboardingWizard
        org={{
          id: ctx.organization.id,
          name: ctx.organization.name,
          city: ctx.organization.city ?? null,
          slogan: ctx.organization.slogan ?? null,
          currency: ctx.organization.currency,
        }}
        modules={(modulesRes.ok ? modulesRes.data : []).map((m) => ({ id: m.id, name: m.name }))}
        activities={(activitiesRes.ok ? activitiesRes.data : []).map((a) => ({ id: a.id, name: a.name }))}
      />
    </div>
  );
}
