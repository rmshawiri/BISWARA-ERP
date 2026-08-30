"use server";

import { getAuthzContext } from "@/server/auth";
import { globalSearch } from "@/engines/search";
import type { GlobalSearchOutput } from "@/engines/search";

export async function globalSearchAction(
  query: string
): Promise<{ results: GlobalSearchOutput["results"] }> {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization) {
    return { results: [] };
  }
  const res = await globalSearch(ctx, query);
  return { results: res.ok ? res.data.results : [] };
}
