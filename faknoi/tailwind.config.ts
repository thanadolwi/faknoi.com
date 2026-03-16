import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
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
          cyan:   "#53CBF3",
          blue:   "#5478FF",
          navy:   "#111FA2",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
      },
      backgroundImage: {
        "blue-grad": "linear-gradient(135deg, #111FA2 0%, #5478FF 50%, #53CBF3 100%)",
        "blue-grad-soft": "linear-gradient(135deg, #5478FF 0%, #53CBF3 100%)",
        "yellow-grad": "linear-gradient(135deg, #FFDE42 0%, #FFB800 100%)",
      },
      boxShadow: {
        "blue-sm":  "0 4px 16px rgba(84,120,255,0.18)",
        "blue-md":  "0 8px 32px rgba(84,120,255,0.22)",
        "blue-lg":  "0 16px 48px rgba(84,120,255,0.25)",
        "card":     "0 2px 16px rgba(17,31,162,0.07)",
        "card-hover": "0 8px 32px rgba(84,120,255,0.14)",
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      animation: {
        "float":      "float 5s ease-in-out infinite",
        "float-slow": "float 8s ease-in-out infinite",
        "pop":        "pop 0.2s ease-out",
        "gradient":   "gradient 4s ease infinite",
      },
      keyframes: {
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%":     { transform: "translateY(-10px)" },
        },
        pop: {
          "0%":   { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)",    opacity: "1" },
        },
        gradient: {
          "0%,100%": { backgroundPosition: "0% 50%" },
          "50%":     { backgroundPosition: "100% 50%" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
