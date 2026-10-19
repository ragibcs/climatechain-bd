/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        climate: {
          bg: "#0B0F19",
          card: "#111827",
          border: "#1F2937",
          accent: "#0284C7",
          muted: "#9CA3AF"
        }
      }
    },
  },
  plugins: [],
};
