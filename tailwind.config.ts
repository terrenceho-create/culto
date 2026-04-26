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
        cream: "#F5F0E8",
        ink: "#1A1A1A",
        "ink-muted": "#555555",
        "ink-faint": "#999999",
        border: "#D4CFC5",
        "border-dark": "#1A1A1A",
        accent: "#1A1A1A",
      },
      fontFamily: {
        mono: ["'Courier New'", "Courier", "monospace"],
      },
      borderRadius: {
        DEFAULT: "0px",
        sm: "2px",
        md: "2px",
        lg: "2px",
        xl: "2px",
        "2xl": "2px",
        full: "9999px",
      },
      spacing: {
        "grid": "24px",
      },
      fontSize: {
        "display": ["3.5rem", { lineHeight: "1", letterSpacing: "-0.02em", fontWeight: "700" }],
        "heading": ["1.5rem", { lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "700" }],
      },
    },
  },
  plugins: [],
};
export default config;
