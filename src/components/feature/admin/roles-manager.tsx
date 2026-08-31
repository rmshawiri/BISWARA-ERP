"use client";

import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save, ShieldCheck } from "lucide-react";
import type { Role } from "@/db/schema";
import {
  createRoleAction,
  deleteRoleAction,
  setRolePermissionsAction,
  assignRoleToUserAction,
} from "@/modules/admin/actions";
import { PERMISSION_ACTIONS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

const MODULE_LABELS: Record<string, string> = {
  admin: "Administration",
  settings: "Paramètres",
  notifications: "Notifications",
  crm: "CRM",
  sales: "Gestion Commerciale",
  catalog: "Catalogue",
  stock: "Stock",
  purchases: "Achats",
  finance: "Finance",
  accounting: "Comptabilité",
  assets: "Immobilisations",
  employee_portal: "Portail Employé",
  hr: "RH",
  logistics: "Logistique",
  projects: "Projets",
  activities: "Activités",
};

const ACTION_LABELS: Record<string, string> = {
  view: "Voir",
  create: "Créer",
  update: "Modifier",
  delete: "Supprimer",
  validate: "Valider",
  export: "Exporter",
  import: "Importer",
  print: "Imprimer",
  share: "Partager",
  configure: "Configurer",
};

interface RolePerms {
  roleId: string;
  perms: Record<string, string[]>;
}

export function RolesManager({
  roles,
  moduleKeys,
  users,
  permsByRole,
  userRoleMap,
}: {
  roles: Role[];
  moduleKeys: string[];
  users: { id: string; fullName: string; username: string }[];
  permsByRole: RolePerms[];
  userRoleMap: Record<string, string[]>;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [name, setName] = React.useState("");
  const [desc, setDesc] = React.useState("");
  const [drafts, setDrafts] = React.useState<Record<string, Record<string, boolean>>>({});
  const [selected, setSelected] = React.useState<string | null>(null);

  // Initialiser les brouillons de permissions par rôle.
  React.useEffect(() => {
    const init: Record<string, Record<string, boolean>> = {};
    for (const rp of permsByRole) {
      const m: Record<string, boolean> = {};
      for (const mod of moduleKeys) {
        for (const act of PERMISSION_ACTIONS) {
          m[`${mod}:${act}`] = (rp.perms[mod] ?? []).includes(act);
        }
      }
      init[rp.roleId] = m;
    }
    setDrafts((d) => ({ ...d, ...init }));
  }, [permsByRole, moduleKeys]);

  function toggle(roleId: string, key: string) {
    setDrafts((d) => {
      const rd = { ...(d[roleId] ?? {}) };
      rd[key] = !rd[key];
      return { ...d, [roleId]: rd };
    });
  }

  function savePerms(roleId: string) {
    const perms = Object.entries(drafts[roleId] ?? {})
      .filter(([, v]) => v)
      .map(([k]) => {
        const [module, action] = k.split(":");
        return { module: module!, action: action! };
      });
    startTransition(async () => {
      const res = await setRolePermissionsAction(roleId, perms);
      if (res.ok) toast.success("Permissions enregistrées");
      else toast.error(res.error ?? "Erreur");
      router.refresh();
    });
  }

  function createRole(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return toast.error("Nom requis.");
    startTransition(async () => {
      const fd = new FormData();
      fd.set("name", name);
      fd.set("description", desc);
      const res = await createRoleAction(fd);
      if (res.ok) {
        toast.success("Rôle créé");
        setName("");
        setDesc("");
      } else toast.error(res.error ?? "Erreur");
      router.refresh();
    });
  }

  function remove(roleId: string) {
    if (!confirm("Supprimer ce rôle ?")) return;
    startTransition(async () => {
      const res = await deleteRoleAction(roleId);
      if (res.ok) toast.success("Rôle supprimé");
      else toast.error(res.error ?? "Erreur");
      router.refresh();
    });
  }

  function assign(userId: string, roleId: string, on: boolean) {
    startTransition(async () => {
      const res = await assignRoleToUserAction(userId, roleId, on);
      if (res.ok) toast.success(on ? "Rôle attribué" : "Rôle retiré");
      else toast.error(res.error ?? "Erreur");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4" />
            Rôles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <form onSubmit={createRole} className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Nom du rôle</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : Comptable" className="h-8 w-48" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Description</Label>
              <Input value={desc} onChange={(e) => setDesc(e.target.value)} className="h-8 w-64" />
            </div>
            <Button type="submit" size="sm" disabled={pending}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Créer
            </Button>
          </form>

          <div className="flex flex-wrap gap-2">
            {roles.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelected(selected === r.id ? null : r.id)}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                  selected === r.id ? "border-primary bg-primary/10" : "hover:bg-muted"
                }`}
              >
                {r.name}
              </button>
            ))}
          </div>

          {roles.map((r) => {
            if (selected !== r.id) return null;
            const d = drafts[r.id] ?? {};
            return (
              <div key={r.id} className="rounded-xl border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-semibold">{r.name}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" disabled={pending} onClick={() => savePerms(r.id)}>
                      <Save className="mr-1 h-3.5 w-3.5" /> Enregistrer
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive" disabled={pending} onClick={() => remove(r.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="py-1 pr-3">Module</th>
                        {PERMISSION_ACTIONS.map((a) => (
                          <th key={a} className="px-1 py-1 text-center">{ACTION_LABELS[a]}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {moduleKeys.map((mod) => (
                        <tr key={mod} className="border-b last:border-0">
                          <td className="py-1.5 pr-3 font-medium">{MODULE_LABELS[mod] ?? mod}</td>
                          {PERMISSION_ACTIONS.map((a) => {
                            const key = `${mod}:${a}`;
                            return (
                              <td key={a} className="px-1 py-1.5 text-center">
                                <Checkbox checked={!!d[key]} onCheckedChange={() => toggle(r.id, key)} />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Attribution aux utilisateurs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="flex flex-wrap items-center gap-2 rounded-lg border p-2.5 text-sm">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{u.fullName}</p>
                <p className="text-xs text-muted-foreground">@{u.username}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {roles.map((r) => (
                  <label key={r.id} className="flex items-center gap-1 text-xs">
                    <Checkbox
                      checked={(userRoleMap[u.id] ?? []).includes(r.id)}
                      onCheckedChange={(v) => assign(u.id, r.id, !!v)}
                    />
                    {r.name}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
