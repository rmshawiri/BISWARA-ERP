"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logAuthEvent } from "@/server/auth-audit";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SignOutButton({
  className,
  variant = "ghost",
}: {
  className?: string;
  variant?: "ghost" | "outline" | "destructive";
}) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  async function handleSignOut() {
    setLoading(true);
    const supabase = createClient();
    logAuthEvent("logout");
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Button
      variant={variant}
      size="sm"
      className={cn(className)}
      onClick={handleSignOut}
      disabled={loading}
    >
      <LogOut className="h-4 w-4" />
      Déconnexion
    </Button>
  );
}
