/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'nv-green': '#00ff00',
        'nv-dark': '#0a0a0a',
        'nv-gray': '#1a1a1a',
      },
    },
  },
  plugins: [],
}
