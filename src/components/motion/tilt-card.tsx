"use client";

import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * TiltCard — effet 3D qui suit la souris (perspective), désactivé sur
 * appareils tactiles et sur prefers-reduced-motion.
 */
export function TiltCard({
  children,
  className,
  max = 6,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = ref.current;
    if (!card) return;
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const rx = (0.5 - py) * max * 2;
    const ry = (px - 0.5) * max * 2;
    card.style.transition = "transform 0.12s linear, box-shadow 0.4s ease";
    card.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(-3px)`;
  };

  const onLeave = () => {
    const card = ref.current;
    if (!card) return;
    card.style.transition = "transform 0.55s cubic-bezier(0.22,1,0.36,1)";
    card.style.transform = "";
  };

  return (
    <div
      ref={ref}
      className={cn("transform-gpu [transform-style:preserve-3d]", className)}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {children}
    </div>
  );
}
