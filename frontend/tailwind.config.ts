import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        teal: "#1D9E75",
      },
    },
  },
  plugins: [],
} satisfies Config;
