import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#0f172a",
        surface: "#0b1220",
        surfaceElevated: "#111827",
        primary: {
          DEFAULT: "#4f46e5",
          foreground: "#f9fafb"
        },
        muted: "#6b7280",
        borderSubtle: "#1f2933"
      },
      fontFamily: {
        sans: ["system-ui", "ui-sans-serif", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;

