"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Direction = "up" | "down" | "left" | "right" | "zoom" | "fade";

const hiddenClass: Record<Direction, string> = {
  up: "translate-y-10",
  down: "-translate-y-10",
  left: "-translate-x-10",
  right: "translate-x-10",
  zoom: "scale-95",
  fade: "",
};

/**
 * Reveal — apparition au scroll via IntersectionObserver natif + transition CSS.
 * Garantit que le contenu redevient toujours visible dès qu'il entre dans le
 * viewport (robuste, y compris après un remontage Strict Mode), en cohérence
 * avec la direction artistique « aurora nocturne ».
 */
export function Reveal({
  children,
  className,
  direction = "up",
  delay = 0,
  duration = 0.8,
  once = true,
}: {
  children: ReactNode;
  className?: string;
  direction?: Direction;
  delay?: number;
  duration?: number;
  once?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const shown = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Sans IntersectionObserver (très vieux navigateur) : on affiche direct.
    if (!("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }

    const reveal = () => {
      if (once) {
        if (shown.current) return;
        shown.current = true;
      }
      setVisible(true);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            reveal();
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    observer.observe(el);

    return () => observer.disconnect();
  }, [once]);

  return (
    <div
      ref={ref}
      className={cn(
        "will-change-[opacity,transform] transition-[opacity,transform]",
        visible
          ? "translate-x-0 translate-y-0 scale-100 opacity-100"
          : cn("opacity-0", hiddenClass[direction]),
        className
      )}
      style={{
        transitionDelay: `${delay}ms`,
        transitionDuration: `${duration * 1000}ms`,
        transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)",
      }}
    >
      {children}
    </div>
  );
}
