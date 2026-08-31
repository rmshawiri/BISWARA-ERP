"use client";

import * as React from "react";
import { Languages } from "lucide-react";
import { getClientLocale, setClientLocale, LOCALES, LOCALE_LABELS, type Locale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function LanguageSwitcher() {
  const [locale, setLocale] = React.useState<Locale>("fr");

  React.useEffect(() => {
    setLocale(getClientLocale());
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Langue">
          <Languages className="h-[18px] w-[18px]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        {LOCALES.map((l) => (
          <DropdownMenuItem
            key={l}
            onClick={() => setClientLocale(l)}
            className={l === locale ? "bg-accent" : ""}
          >
            {LOCALE_LABELS[l]} — {l.toUpperCase()}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
