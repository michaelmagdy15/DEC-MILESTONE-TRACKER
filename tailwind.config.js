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
        dec: {
          bg: '#0f0f0f',
          text: '#f3f3f3',
          card: '#1a1a1a',
          border: '#2a2a2a',
          accent: '#4f46e5', // Keeping a subtle indigo accent for buttons/indicators
        }
      }
    },
  },
  plugins: [],
}
