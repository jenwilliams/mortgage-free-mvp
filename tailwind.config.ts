import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#eef6ff",
          100: "#d9eaff",
          200: "#b8d7ff",
          300: "#89bbff",
          400: "#5a9bff",
          500: "#2f79ff",
          600: "#1f5fdb",
          700: "#194bb0",
          800: "#173f8f",
          900: "#142f69",
        },
        ink: {
          900: "#0f172a",
          700: "#334155",
          500: "#64748b",
          300: "#cbd5e1",
          100: "#f1f5f9",
        },
        success: "#16a34a",
        warning: "#f59e0b",
        danger:  "#dc2626",
      },
      borderRadius: {
        lg: "16px",
        xl: "20px",
        "2xl": "24px",
      },
      boxShadow: {
        soft: "0 2px 12px rgba(15, 23, 42, 0.06)",
        lift: "0 8px 24px rgba(15, 23, 42, 0.08)",
      },
      fontSize: {
        hero: ["2rem", { lineHeight: "1.2", letterSpacing: "-0.02em" }],
        kpi:  ["1.75rem", { lineHeight: "1.2", letterSpacing: "-0.01em" }],
      },
    },
  },
  plugins: [],
} satisfies Config;
