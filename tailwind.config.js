/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: {
          50: '#faf4e8',
          100: '#f4ead8',
          200: '#e9d8b8',
          300: '#ddc293',
          400: '#d2ac70',
          500: '#c28f4e',
          600: '#9a6c3a',
          700: '#704c2b',
          800: '#4c321e',
          900: '#2c1b10',
        },
      },
      boxShadow: {
        soft: '0 10px 30px rgba(60, 40, 20, 0.15)',
      },
      fontFamily: {
        retro: ['"Noto Serif SC"', 'serif'],
        sans: ['"Noto Sans SC"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
