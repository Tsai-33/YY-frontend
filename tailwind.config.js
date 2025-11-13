/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}", "./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}", "./pages/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "blue-dark": "var(--blue-dark)",
        blue: "var(--blue)",
        "blue-light": "var(--blue-light)",
        "blue-transparent": "var(--blue-transparent)",
      },
      keyframes: {
        "sk-chase": { "100%": { transform: "rotate(360deg)" } },
        "sk-chase-dot": { "80%, 100%": { transform: "rotate(360deg)" } },
        "sk-chase-dot-before": { "0%, 100%": { transform: "scale(1)" }, "50%": { transform: "scale(0.4)" } },
      },
      animation: {
        "sk-chase": "sk-chase 2.5s linear infinite",
        "sk-chase-dot": "sk-chase-dot 2s ease-in-out infinite",
        "sk-chase-dot-before": "sk-chase-dot-before 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
