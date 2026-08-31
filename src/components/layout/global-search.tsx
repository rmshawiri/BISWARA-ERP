"use client";

import * as React from "react";
import Link from "next/link";
import { Search, Loader2 } from "lucide-react";
import { globalSearchAction } from "@/modules/search/actions";
import { useDebounced } from "@/lib/use-debounced";
import { cn } from "@/lib/utils";

interface Item {
  type: string;
  id: string;
  title: string;
  subtitle?: string;
  href: string;
}

/**
 * Barre de recherche globale (Search Engine) dans le header.
 * Recherche en direct avec debounce ; résultats groupés.
 */
export function GlobalSearch({ className }: { className?: string }) {
  const [query, setQuery] = React.useState("");
  const [items, setItems] = React.useState<Item[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [focus, setFocus] = React.useState(false);
  const [recent, setRecent] = React.useState<string[]>([]);
  const debounced = useDebounced(query, 250);
  const box = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const saved = localStorage.getItem("bwr_search_recent");
    if (saved) setRecent(JSON.parse(saved));
  }, []);

  React.useEffect(() => {
    if (debounced.trim()) {
      const next = [debounced.trim(), ...recent.filter((r) => r !== debounced.trim())].slice(0, 5);
      setRecent(next);
      localStorage.setItem("bwr_search_recent", JSON.stringify(next));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  React.useEffect(() => {
    let active = true;
    if (!debounced.trim()) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    globalSearchAction(debounced)
      .then((res) => {
        if (active) setItems(res.results);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [debounced]);

  React.useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (box.current && !box.current.contains(e.target as Node)) setFocus(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const showDropdown = focus;

  return (
    <div ref={box} className={cn("relative w-full max-w-md", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
          }}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          placeholder="Rechercher (produits, clients, documents…)"
          className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          aria-label="Recherche globale"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {showDropdown && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
          {!query.trim() ? (
            <div className="p-2">
              <p className="px-2 pb-1 text-xs font-semibold uppercase text-muted-foreground">Récentes</p>
              {recent.length === 0 ? (
                <p className="px-2 py-1.5 text-sm text-muted-foreground">Aucune recherche récente.</p>
              ) : (
                recent.map((r) => (
                  <button
                    key={r}
                    onClick={() => { setQuery(r); }}
                    className="block w-full px-2 py-1.5 text-left text-sm hover:bg-accent"
                  >
                    {r}
                  </button>
                ))
              )}
            </div>
          ) : items.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Aucun résultat.</p>
          ) : (
            <ul className="max-h-72 overflow-auto">
              {items.map((it, i) => (
                <li key={`${it.type}-${i}`}>
                  <Link
                    href={it.href}
                    onClick={() => setFocus(false)}
                    className="flex items-center justify-between px-3 py-2 text-sm hover:bg-accent"
                  >
                    <span className="truncate font-medium">{it.title}</span>
                    <span className="ml-3 shrink-0 text-xs text-muted-foreground">
                      {it.type}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
