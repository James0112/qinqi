import type { Config } from "tailwindcss"

export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "oklch(var(--background))",
        foreground: "oklch(var(--foreground))",
        card: "oklch(var(--card))",
        "wechat-primary": "oklch(0.55 0.15 145)",
        "wechat-primary-hover": "oklch(0.5 0.15 145)",
        "wechat-bg": "oklch(0.97 0.008 120)",
        "wechat-border": "oklch(0.92 0.01 120)"
      },
      borderRadius: {
        xl: "0.75rem"
      }
    },
  },
  plugins: [],
} satisfies Config
