import type { Metadata } from "next";
import { PlaceholderSection } from "@/components/common/placeholder-section";

export const metadata: Metadata = { title: "Blog & Actualités — BISWARA ERP" };

export default function BlogPage() {
  return (
    <PlaceholderSection
      title="Blog & Actualités"
      description="Nouveautés BISWARA, conseils de gestion, comptabilité, RH et plus encore. (contenu SEO à venir)"
      sprint="Contenu SEO"
    />
  );
}
