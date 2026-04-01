import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: "oklch(0.72 0.12 175)",
          dim: "oklch(0.72 0.12 175 / 0.15)",
          subtle: "oklch(0.72 0.12 175 / 0.08)",
          muted: "oklch(0.55 0.10 175)",
          bright: "oklch(0.80 0.14 175)",
        },
        surface: {
          void: "oklch(0.13 0.008 280)",
          base: "oklch(0.155 0.008 280)",
          raised: "oklch(0.19 0.008 280)",
          elevated: "oklch(0.225 0.008 280)",
          overlay: "oklch(0.26 0.008 280)",
        },
        ink: {
          DEFAULT: "oklch(0.93 0.005 280)",
          secondary: "oklch(0.65 0.008 280)",
          tertiary: "oklch(0.48 0.008 280)",
          faint: "oklch(0.35 0.008 280)",
        },
        ghost: "oklch(1 0 0 / 0.06)",
        nucleotide: {
          A: "oklch(0.72 0.16 155)",
          T: "oklch(0.68 0.16 35)",
          C: "oklch(0.70 0.13 240)",
          G: "oklch(0.75 0.13 85)",
        },
        danger: {
          DEFAULT: "oklch(0.63 0.2 25)",
          dim: "oklch(0.63 0.2 25 / 0.15)",
          muted: "oklch(0.50 0.15 25)",
        },
        amber: {
          DEFAULT: "oklch(0.78 0.14 75)",
          dim: "oklch(0.78 0.14 75 / 0.15)",
        },
      },
      fontFamily: {
        sans: ['"Inter"', "system-ui", "-apple-system", "sans-serif"],
        mono: ['"JetBrains Mono"', '"SF Mono"', '"Fira Code"', "monospace"],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
      boxShadow: {
        glow: "0 0 20px oklch(0.72 0.12 175 / 0.15)",
        "glow-lg": "0 0 40px oklch(0.72 0.12 175 / 0.12)",
        "inset-ring": "inset 0 0 0 1px oklch(1 0 0 / 0.06)",
      },
    },
  },
  plugins: [],
} satisfies Config;
