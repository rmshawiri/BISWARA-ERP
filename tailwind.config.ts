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
        // Famille de marque BISWARA — palette « aurora » ancrée sur le bleu officiel.
        // (bleu électrique #2E86FF → cyan #22D3EE → or #FFD700). Les noms de classes
        // restent inchangés ; seules les valeurs suivent l'identité BISWARA.
        biswara: {
          blue: {
            DEFAULT: "#2E86FF",
            50: "#EAF3FE",
            100: "#D3E6FD",
            200: "#A6CDFB",
            300: "#79AEF8",
            400: "#4D90F5",
            500: "#2E86FF",
            600: "#1D6BDE",
            700: "#154FA8",
            800: "#0E3573",
            900: "#003366",
          },
          gold: {
            DEFAULT: "#FFD700",
            50: "#FFFBEB",
            100: "#FFF6C9",
            200: "#FFEE99",
            300: "#FFE666",
            400: "#FFDE33",
            500: "#FFD700",
            600: "#C9A800",
            700: "#947A00",
            800: "#605000",
            900: "#2D2600",
          },
          green: {
            DEFAULT: "#00A859",
            50: "#E7F7EF",
            100: "#C9EFDC",
            200: "#94DFB9",
            300: "#5FCF97",
            400: "#2FBF78",
            500: "#00A859",
            600: "#008A48",
            700: "#006B38",
            800: "#004D28",
            900: "#002F18",
          },
          violet: {
            DEFAULT: "#FFD700",
            500: "#FFD700",
            600: "#C9A800",
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
        brand: "0 8px 24px -10px rgba(46,134,255,.55)",
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
