import type { Config } from "tailwindcss";

/**
 * Design System BISWARA - Palette officielle (éléments protégés).
 *   Bleu MORA      : #003366
 *   Or Shawiri     : #FFD700
 *   Vert Performance: #00A859
 * Ces couleurs sont fixes et ne doivent être modifiées sans validation.
 */
const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Charte officielle BISWARA
        biswara: {
          blue: {
            DEFAULT: "#003366",
            50: "#e6edf5",
            100: "#c2d2e3",
            200: "#8fa9c7",
            300: "#5c7fab",
            400: "#2f5a8f",
            500: "#003366",
            600: "#002b54",
            700: "#002044",
            800: "#001633",
            900: "#000d20",
          },
          gold: {
            DEFAULT: "#FFD700",
            50: "#fffbe6",
            100: "#fff3b3",
            200: "#ffeb80",
            300: "#ffe34d",
            400: "#ffdd1a",
            500: "#FFD700",
            600: "#ccab00",
            700: "#997f00",
            800: "#665400",
            900: "#332a00",
          },
          green: {
            DEFAULT: "#00A859",
            50: "#e6f9ef",
            100: "#b8ecce",
            200: "#8adfae",
            300: "#57cf8a",
            400: "#2bbd6c",
            500: "#00A859",
            600: "#008747",
            700: "#006636",
            800: "#004424",
            900: "#002312",
          },
        },
        // Couleurs complémentaires
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
