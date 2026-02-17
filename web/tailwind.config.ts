import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#06080c",
        surface: "#0a0e14",
        "surface-2": "#0f1419",
        "surface-3": "#151c24",
        border: "#1a2233",
        "border-2": "#232f40",
        green: {
          DEFAULT: "#00ff88",
          dim: "#00cc6a",
          dark: "#002a15",
          glow: "rgba(0, 255, 136, 0.12)",
        },
        red: {
          DEFAULT: "#ff2e4c",
          dim: "#cc2944",
          dark: "#2a0010",
          glow: "rgba(255, 46, 76, 0.12)",
        },
        cyan: {
          DEFAULT: "#00d4ff",
          dim: "#00a8cc",
          dark: "#001a22",
          glow: "rgba(0, 212, 255, 0.10)",
        },
        shark: {
          DEFAULT: "#ff6b35",
          glow: "rgba(255, 107, 53, 0.12)",
          dark: "rgba(255, 107, 53, 0.06)",
        },
        wolf: {
          DEFAULT: "#8b5cf6",
          glow: "rgba(139, 92, 246, 0.12)",
          dark: "rgba(139, 92, 246, 0.06)",
        },
        grid: {
          DEFAULT: "#06b6d4",
          glow: "rgba(6, 182, 212, 0.12)",
          dark: "rgba(6, 182, 212, 0.06)",
        },
        muted: "#5a6b80",
        "muted-2": "#3a4a5c",
        foreground: "#e8edf4",
        "foreground-2": "#c0cad8",
      },
      fontFamily: {
        display: ["'Syne'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      fontSize: {
        xxs: ["0.625rem", { lineHeight: "0.875rem" }],
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out both",
        breathe: "breathe 2.5s ease-in-out infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
export default config;
