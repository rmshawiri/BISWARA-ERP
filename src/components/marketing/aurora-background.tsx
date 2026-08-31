"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * AuroraBackground — fond « aurora nocturne » pour le hero.
 * Trois couches : pastilles de dégradé floues (CSS), grille lumineuse (CSS),
 * et une constellation de particules interactive (canvas, pauses hors écran).
 * Comportement adapté du langage de la référence NOVA mais aux couleurs
 * BISWARA (indigo / violet / cyan).
 */
export function AuroraBackground({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const COLORS = ["124, 92, 255", "255, 78, 205", "34, 211, 238"];
    const LINK_DIST = 120;
    const MOUSE_RADIUS = 170;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    let particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      c: string;
      a: number;
      burst?: boolean;
    }[] = [];
    let width = 0;
    let height = 0;
    let running = true;
    let raf: number | null = null;
    const mouse = { x: -9999, y: -9999, active: false };
    const rand = (min: number, max: number) => min + Math.random() * (max - min);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * DPR;
      canvas.height = height * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      seed();
    };

    const seed = () => {
      const target = Math.max(34, Math.min(100, Math.round((width * height) / 14000)));
      particles = Array.from({ length: target }, () => ({
        x: rand(0, width),
        y: rand(0, height),
        vx: rand(-0.35, 0.35),
        vy: rand(-0.35, 0.35),
        r: rand(1, 2.3),
        c: COLORS[(Math.random() * COLORS.length) | 0] ?? COLORS[0]!,
        a: rand(0.35, 0.85),
      }));
    };

    const burst = (x: number, y: number, count = 26) => {
      for (let i = 0; i < count; i++) {
        const angle = rand(0, Math.PI * 2);
        const speed = rand(1.5, 4.5);
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          r: rand(1, 2.6),
          c: COLORS[(Math.random() * COLORS.length) | 0] ?? COLORS[0]!,
          a: 1,
          burst: true,
        });
      }
    };

    const step = () => {
      if (!running) {
        raf = null;
        return;
      }
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        if (mouse.active) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < MOUSE_RADIUS * MOUSE_RADIUS) {
            const d = Math.sqrt(d2) || 1;
            const force = (MOUSE_RADIUS - d) / MOUSE_RADIUS;
            p.vx += (dx / d) * force * 0.08;
            p.vy += (dy / d) * force * 0.08;
          }
        }

        if (p.burst) {
          p.a -= 0.02;
          p.vx *= 0.985;
          p.vy *= 0.985;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.c}, ${Math.max(p.a, 0)})`;
        ctx.fill();
      }

      particles = particles.filter((p) => p.a > 0);

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i]!;
          const b = particles[j]!;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < LINK_DIST * LINK_DIST) {
            const alpha = (1 - Math.sqrt(d2) / LINK_DIST) * 0.35;
            ctx.strokeStyle = `rgba(124, 92, 255, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      if (mouse.active) {
        for (const p of particles) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < MOUSE_RADIUS * MOUSE_RADIUS) {
            const alpha = (1 - Math.sqrt(d2) / MOUSE_RADIUS) * 0.5;
            ctx.strokeStyle = `rgba(34, 211, 238, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }
      }

      raf = requestAnimationFrame(step);
    };

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };
    const onLeave = () => {
      mouse.active = false;
    };
    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      burst(e.clientX - rect.left, e.clientY - rect.top);
    };

    let heroVisible = true;
    const hero = canvas.closest("section");
    const observer =
      hero && "IntersectionObserver" in window
        ? new IntersectionObserver((entries) => {
            const entry = entries[0];
            if (!entry) return;
            heroVisible = entry.isIntersecting;
            running = heroVisible && !document.hidden;
            if (running && !raf) raf = requestAnimationFrame(step);
          }, { threshold: 0 })
        : null;
    observer?.observe(hero ?? canvas);

    const onVisibility = () => {
      running = heroVisible && !document.hidden;
      if (running && !raf) raf = requestAnimationFrame(step);
    };

    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("mousemove", onMove, { passive: true });
    canvas.addEventListener("mouseleave", onLeave);
    canvas.addEventListener("click", onClick);
    document.addEventListener("visibilitychange", onVisibility);

    resize();
    raf = requestAnimationFrame(step);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
      canvas.removeEventListener("click", onClick);
      document.removeEventListener("visibilitychange", onVisibility);
      observer?.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden="true">
      {/* Pastilles aurora floues */}
      <div
        className="absolute -left-[15%] -top-[20%] h-[55vmax] w-[55vmax] rounded-full blur-[90px]"
        style={{
          background: "radial-gradient(circle, rgba(124,92,255,.5), transparent 65%)",
          animation: "aurora-drift 22s ease-in-out infinite alternate",
        }}
      />
      <div
        className="absolute -right-[20%] top-[10%] h-[45vmax] w-[45vmax] rounded-full blur-[90px]"
        style={{
          background: "radial-gradient(circle, rgba(34,211,238,.38), transparent 65%)",
          animation: "aurora-drift 26s ease-in-out infinite alternate-reverse",
        }}
      />
      <div
        className="absolute bottom-[-25%] left-[30%] h-[40vmax] w-[40vmax] rounded-full blur-[90px]"
        style={{
          background: "radial-gradient(circle, rgba(255,78,205,.4), transparent 65%)",
          animation: "aurora-drift 30s ease-in-out infinite alternate",
        }}
      />

      {/* Grille lumineuse */}
      <div className="bg-grid-fade absolute inset-0" />

      {/* Constellation interactive */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
