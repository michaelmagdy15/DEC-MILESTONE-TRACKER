/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
      },
      colors: {
        orange: {
          50: '#fff4ed',
          100: '#ffe5d3',
          200: '#ffc8a5',
          300: '#ffa26d',
          400: '#ff7432',
          500: '#f3822d', // Exact match with DEC logo
          600: '#e55c13',
          700: '#be4311',
          800: '#973515',
          900: '#7a2f15',
          950: '#421408',
        },
        dec: {
          bg: '#0f0f0f',
          text: '#f3f3f3',
          card: '#1a1a1a',
          border: '#2a2a2a',
          accent: '#f3822d', // Updating the accent color to the logo's orange
        }
      }
    },
  },
  plugins: [],
}
