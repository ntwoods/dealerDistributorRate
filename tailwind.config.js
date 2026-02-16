/** @type {import("tailwindcss").Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Manrope", "ui-sans-serif", "system-ui"],
        display: ["Sora", "Manrope", "ui-sans-serif", "system-ui"],
      },
      boxShadow: {
        soft: "0 20px 45px -24px rgba(12, 47, 58, 0.35)",
      },
      colors: {
        brand: {
          50: "#eefaf8",
          100: "#d4f3ef",
          200: "#a7e8df",
          300: "#72d8ce",
          400: "#42c2b7",
          500: "#25a7a0",
          600: "#1c8684",
          700: "#1a6b6b",
          800: "#1a5456",
          900: "#1a474a"
        }
      }
    },
  },
  plugins: [],
};


