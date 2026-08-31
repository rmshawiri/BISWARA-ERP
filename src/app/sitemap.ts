import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url.replace(/\/+$/, "");
  const routes = [
    { path: "", priority: 1 },
    { path: "/pricing", priority: 0.9 },
    { path: "/faq", priority: 0.7 },
    { path: "/contact", priority: 0.6 },
    { path: "/blog", priority: 0.5 },
  ];
  return routes.map((r) => ({
    url: `${base}${r.path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: r.priority,
  }));
}
