/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "primary": "#186be7",
        "background-light": "#f6f7f8",
        "background-dark": "#111721",
        "surface-light": "#ffffff",
        "surface-dark": "#1e293b",
        "text-primary-light": "#111418",
        "text-primary-dark": "#f0f2f4",
        "text-secondary-light": "#637288",
        "text-secondary-dark": "#94a3b8",
      },
      fontFamily: {
        "display": ["System"] // Fallback to system font for simplicity in this setup
      },
      borderRadius: {
        "DEFAULT": "16px", // 1rem
        "lg": "32px", // 2rem
        "xl": "48px", // 3rem
        "full": "9999px"
      },
    },
  },
  plugins: [],
}
