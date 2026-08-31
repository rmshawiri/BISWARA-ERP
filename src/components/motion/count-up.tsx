"use client";

import { useEffect, useRef, useState } from "react";

/**
 * CountUp — compteur animé (easeOutExpo) déclenché à l'entrée dans le viewport,
 * piloté par un IntersectionObserver natif (robuste, y compris Strict Mode).
 */
export function CountUp({
  to,
  from = 0,
  suffix = "",
  decimals = 0,
  duration = 1.6,
  className,
}: {
  to: number;
  from?: number;
  suffix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(from);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      setValue(to);
      return;
    }

    let started = false;
    let raf = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min((now - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(2, -10 * t);
      const current = decimals
        ? Number((to * eased).toFixed(decimals))
        : Math.round(to * eased);
      setValue(t === 1 ? to : current);
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started) {
            started = true;
            raf = requestAnimationFrame(tick);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to, from, decimals, duration]);

  return (
    <span ref={ref} className={className}>
      {decimals ? value.toFixed(decimals) : value}
      {suffix}
    </span>
  );
}
