"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

/**
 * ScrollChrome — barre de progression de scroll + bouton « retour en haut »
 * (anneau de progression). Micro-interaction premium de la direction artistique.
 */
export function ScrollChrome() {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let ticking = false;
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
      setProgress(pct);
      setVisible(window.scrollY > 600);
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const CIRC = 2 * Math.PI * 21;

  return (
    <>
      {/* Barre de progression */}
      <div className="pointer-events-none fixed left-0 top-0 z-[60] h-[3px] w-full">
        <div
          className="h-full bg-[var(--aurora-grad-full)] shadow-[0_0_12px_rgba(46,134,255,0.8)]"
          style={{ width: `${(progress * 100).toFixed(2)}%` }}
        />
      </div>

      {/* Retour en haut */}
      <button
        type="button"
        aria-label="Retour en haut de page"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`fixed bottom-5 right-5 z-50 grid h-[52px] w-[52px] place-items-center rounded-full border border-white/10 bg-[#0a0d1f]/80 backdrop-blur-md shadow-[var(--shadow-md)] transition-all duration-500 ${
          visible
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0"
        } hover:-translate-y-1 hover:border-[rgba(46,134,255,0.5)]`}
      >
        <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 48 48" aria-hidden="true">
          <circle cx="24" cy="24" r="21" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3" />
          <circle
            cx="24"
            cy="24"
            r="21"
            fill="none"
            stroke="url(#bwr-ring)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - progress)}
            style={{ transition: "stroke-dashoffset 0.1s linear" }}
          />
          <defs>
            <linearGradient id="bwr-ring" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#2E86FF" />
              <stop offset="1" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
        </svg>
        <ArrowUp className="h-5 w-5 text-white" />
      </button>
    </>
  );
}
