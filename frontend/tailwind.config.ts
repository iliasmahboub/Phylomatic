import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        teal: {
          DEFAULT: "#1D9E75",
          50: "#EEFBF5",
          100: "#D5F6E8",
          200: "#AEECD3",
          300: "#79DCB8",
          400: "#42C598",
          500: "#1D9E75",
          600: "#12835F",
          700: "#0F694D",
          800: "#10533F",
          900: "#0E4435",
        },
      },
      fontFamily: {
        mono: ['"SF Mono"', '"Fira Code"', '"JetBrains Mono"', "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;
