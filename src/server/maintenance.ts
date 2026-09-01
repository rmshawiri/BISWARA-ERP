import "server-only";

import { readSystemSetting } from "@/modules/platform/system-settings";

/** Le mode maintenance est-il actif ? (défaut permissif : false). */
export async function isMaintenanceActive(): Promise<boolean> {
  try {
    const v = await readSystemSetting("maintenance_enabled");
    return v === "true";
  } catch {
    return false;
  }
}
