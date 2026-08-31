import type { Config } from "tailwindcss";

/**
 * Design System BISWARA ERP — identité visuelle moderne.
 * Palette principale : indigo/violet + cyan (accent), vert émeraude (succès),
 * ambre (avertissement), rose (destructif).
 * Les couleurs officielles protégées du logo restent utilisées pour le logo lui-même.
 */
const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Famille de marque BISWARA — palette « aurora » de référence
        // (violet #7c5cff → cyan #22d3ee → rose #ff4ecd).
        // Les noms de classes restent inchangés ; seules les valeurs suivent la référence.
        biswara: {
          blue: {
            DEFAULT: "#7C5CFF",
            50: "#F5F3FF",
            100: "#EDE9FE",
            200: "#DDD6FE",
            300: "#C4B5FD",
            400: "#A78BFA",
            500: "#7C5CFF",
            600: "#6D3BE8",
            700: "#5B31C7",
            800: "#4A289E",
            900: "#3C2278",
          },
          gold: {
            DEFAULT: "#F59E0B",
            50: "#FFFBEB",
            100: "#FEF3C7",
            200: "#FDE68A",
            300: "#FCD34D",
            400: "#FBBF24",
            500: "#F59E0B",
            600: "#D97706",
            700: "#B45309",
            800: "#92400E",
            900: "#78350F",
          },
          green: {
            DEFAULT: "#10B981",
            50: "#ECFDF5",
            100: "#D1FAE5",
            200: "#A7F3D0",
            300: "#6EE7B7",
            400: "#34D399",
            500: "#10B981",
            600: "#059669",
            700: "#047857",
            800: "#065F46",
            900: "#064E3B",
          },
          violet: {
            DEFAULT: "#FF4ECD",
            500: "#FF4ECD",
            600: "#F231B8",
          },
          cyan: {
            DEFAULT: "#22D3EE",
            500: "#22D3EE",
            600: "#0EB8D6",
          },
        },
        // Tokens sémantiques (HSL from CSS variables)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        success: { DEFAULT: "hsl(var(--success))" },
        warning: { DEFAULT: "hsl(var(--warning))" },
        info: { DEFAULT: "hsl(var(--info))" },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 5px)",
        "2xl": "1rem",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        card: "0 1px 2px rgba(15,23,42,.04), 0 10px 30px -10px rgba(15,23,42,.12)",
        brand: "0 8px 24px -10px rgba(124,92,255,.55)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "fade-in-up": { from: { opacity: "0", transform: "translateY(10px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        shimmer: { "100%": { transform: "translateX(100%)" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "fade-in-up": "fade-in-up 0.45s cubic-bezier(.16,1,.3,1) both",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
