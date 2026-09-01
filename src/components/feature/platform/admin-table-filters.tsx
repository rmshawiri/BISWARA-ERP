"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface AdminFilterOption {
  value: string;
  label: string;
}

interface AdminTableFiltersProps {
  /** Chemin de base (ex. /admin/utilisateurs). */
  basePath: string;
  /** Valeur de recherche initiale. */
  q?: string;
  /** Selecteur « statut » (optionnel). */
  statusValue?: string;
  statusLabel?: string;
  statusOptions?: AdminFilterOption[];
  /** Selecteur secondaire (ex. forfait / rôle) (optionnel). */
  secondaryValue?: string;
  secondaryLabel?: string;
  secondaryOptions?: AdminFilterOption[];
  /** Clé du paramètre d'URL pour le selecteur secondaire (ex. "plan" ou "role"). */
  secondaryKey?: string;
  placeholder?: string;
}

/**
 * Barre de filtres d'une liste admin. Soumet via navigation (router.push)
 * en conservant les autres paramètres et en réinitialisant la page courante.
 */
export function AdminTableFilters({
  basePath,
  q = "",
  statusValue,
  statusLabel = "Statut",
  statusOptions = [],
  secondaryValue = "",
  secondaryLabel = "Filtre",
  secondaryOptions = [],
  secondaryKey = "role",
  placeholder = "Rechercher…",
}: AdminTableFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function apply(overrides: Record<string, string | undefined>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(overrides)) {
      if (!v || v === "__all__") next.delete(k);
      else next.set(k, v);
    }
    next.delete("page");
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form
        className="flex flex-1 items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          apply({ q: String(fd.get("q") ?? "") });
        }}
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={q}
            placeholder={placeholder}
            className="pl-8"
          />
        </div>
        <Button type="submit" size="sm" variant="secondary">
          Rechercher
        </Button>
        {q && (
          <Button type="button" size="sm" variant="ghost" onClick={() => router.replace(basePath)}>
            <X className="mr-1 h-3 w-3" /> Réinitialiser
          </Button>
        )}
      </form>

      {statusOptions.length > 0 && (
        <Select value={statusValue ?? "__all__"} onValueChange={(v) => apply({ status: v })}>
          <SelectTrigger className="h-8 w-40 text-xs">
            <SelectValue placeholder={statusLabel} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{statusLabel} : tous</SelectItem>
            {statusOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {secondaryOptions.length > 0 && (
        <Select
          value={secondaryValue ?? "__all__"}
          onValueChange={(v) => apply({ [secondaryKey]: v })}
        >
          <SelectTrigger className="h-8 w-40 text-xs">
            <SelectValue placeholder={secondaryLabel} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{secondaryLabel} : tous</SelectItem>
            {secondaryOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
