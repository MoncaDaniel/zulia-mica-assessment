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
        brand: {
          50: "#fff7ed",
          100: "#ffedd5",
          500: "#FF7A00",
          600: "#ea6d00",
          700: "#c25800",
          900: "#7c3700",
        },
        slate: {
          850: "#18202e",
          950: "#0c1220",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Syne", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
