"use client";

import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { createOrgCollaboratorAction } from "@/modules/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function InviteCollaboratorButton({
  limit,
  current,
}: {
  limit: number;
  current: number;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [fullName, setFullName] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [email, setEmail] = React.useState("");

  const remaining = Math.max(0, limit - current);
  const full = current >= limit;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await createOrgCollaboratorAction({ fullName, username, email });
      if (res.ok) {
        const data = (res as { data?: { temporaryPassword: string } }).data;
        toast.success(
          data?.temporaryPassword
            ? `Collaborateur créé. Mot de passe temporaire : ${data.temporaryPassword}`
            : "Collaborateur créé."
        );
        setOpen(false);
        setFullName(""); setUsername(""); setEmail("");
      } else {
        toast.error(res.error ?? "Erreur");
      }
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={full}>
          <UserPlus className="mr-1 h-3.5 w-3.5" />
          Inviter ({current}/{limit})
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Inviter un collaborateur</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">
          {full
            ? "Limite d'utilisateurs atteinte pour ce forfait. Changez de forfait pour inviter davantage."
            : `Plafond du forfait : ${limit} utilisateur(s) — ${remaining} restant(s).`}
        </p>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1">
            <Label>Nom complet</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label>Nom d'utilisateur</Label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label>E-mail</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending || full}>
              {pending ? "Création…" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
