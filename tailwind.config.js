/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Fira Sans', 'Manrope', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
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
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.8)',
        'orange-glow': '0 0 20px rgba(243, 130, 45, 0.15)',
        'orange-glow-strong': '0 0 30px rgba(243, 130, 45, 0.25)',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
        'pulse-glow': 'pulseGlow 2s infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      }
    },
  },
  plugins: [],
}
