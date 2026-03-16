import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          yellow: "#FFDE42",
          cyan: "#53CBF3",
          blue: "#5478FF",
          navy: "#111FA2",
        },
        candy: {
          pink:   "#FFB3D9",
          lilac:  "#D4B8FF",
          mint:   "#B8F0E0",
          peach:  "#FFD4B8",
          sky:    "#B8E8FF",
          lemon:  "#FFF5B8",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
      },
      borderRadius: {
        blob: "60% 40% 70% 30% / 50% 60% 40% 50%",
      },
      animation: {
        gradient: "gradient 4s ease infinite",
        float: "float 6s ease-in-out infinite",
        wiggle: "wiggle 0.4s ease-in-out",
        "spin-slow": "spin 8s linear infinite",
      },
      keyframes: {
        gradient: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
