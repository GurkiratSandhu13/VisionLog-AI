/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F8F6F1',
        foreground: '#1C1C1E',
        accent: '#B8953F',
        surface: '#FFFFFF',
        surfaceAlt: '#EEEBE4',
        border: '#E0DAD0'
      },
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        serif: ['"Cormorant Garamond"', 'serif'],
      },
      boxShadow: {
        'luxury': '0 1px 4px rgba(0,0,0,0.06)',
      }
    },
  },
  plugins: [],
}
