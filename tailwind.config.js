/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/renderer/**/*.{js,jsx,ts,tsx}",
    "./src/renderer/index.html",
  ],
  theme: {
    extend: {
      colors: {
        'gh-primary': '#1a1b26',
        'gh-secondary': '#a9b1d6',
        'gh-accent': '#7aa2f7',
        'gh-background': 'rgba(26, 27, 38, 0.95)',
        'gh-header': 'rgba(26, 27, 38, 0.98)',
        'gh-text': '#c0caf5',
        'gh-text-secondary': '#9aa5ce',
      },
      backdropBlur: {
        'xs': '2px',
      }
    },
  },
  plugins: [],
} 