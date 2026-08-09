/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Architect OS Studio brand palette
        brand: {
          50: '#eef4ff', 100: '#dbe6ff', 200: '#bccffe', 300: '#8eabfc',
          400: '#597ff8', 500: '#345af0', 600: '#1f3fe0', 700: '#1a31c4',
          800: '#1c2c9f', 900: '#1c2a7d', 950: '#151b4a'
        },
        ink: {
          50: '#f6f7f9', 100: '#eceef2', 200: '#d4d8e0', 300: '#adb5c4',
          400: '#808ca3', 500: '#606d87', 600: '#4c5670', 700: '#3f475c',
          800: '#373d4e', 900: '#0f1320', 950: '#080a12'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif']
      },
      boxShadow: {
        card: '0 1px 2px rgba(8,10,18,.06), 0 8px 24px rgba(8,10,18,.08)',
        pop: '0 12px 40px rgba(8,10,18,.24)'
      },
      keyframes: {
        'fade-in': { from: { opacity: '0', transform: 'translateY(4px)' }, to: { opacity: '1', transform: 'none' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } }
      },
      animation: {
        'fade-in': 'fade-in .25s ease both'
      }
    }
  },
  plugins: []
}
