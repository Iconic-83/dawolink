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
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        border: "hsl(var(--border))",
        brand: {
          purple: {
            DEFAULT: "#2D1B8E",
            dark: "#180D62",
            mid: "#3D2AAD",
            light: "#5A45CC",
            50: "#F4F2FF",
            100: "#E8E4FF",
          },
          teal: {
            DEFAULT: "#00C897",
            dark: "#009E78",
            light: "#2DDBA8",
            50: "#F0FDF9",
            100: "#CCFAEE",
          },
          blue: {
            DEFAULT: "#4A8FE5",
            dark: "#2B6FCC",
          },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

export default config;
