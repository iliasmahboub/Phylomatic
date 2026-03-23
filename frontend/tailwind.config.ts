import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: "#1D9E75",
          50: "#F0FDF8",
          100: "#CCFBEB",
          200: "#9AF5D6",
          300: "#5FE8BD",
          400: "#2DD4A0",
          500: "#1D9E75",
          600: "#0F7D5E",
          700: "#10644D",
          800: "#114F3F",
          900: "#114236",
        },
        surface: {
          0: "#FFFFFF",
          1: "#F8FAFB",
          2: "#F1F4F6",
          3: "#E8ECEF",
          4: "#D5DBE0",
        },
        ink: {
          DEFAULT: "#0F1419",
          secondary: "#536471",
          tertiary: "#8899A6",
          faint: "#BCC7CF",
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
        "card": "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)",
        "card-hover": "0 4px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.08)",
        "elevated": "0 8px 30px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)",
        "inner-ring": "inset 0 0 0 1px rgba(0,0,0,0.04)",
      },
    },
  },
  plugins: [],
} satisfies Config;
