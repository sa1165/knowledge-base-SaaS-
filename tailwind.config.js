/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "c:/Users/Sanjeev/Documents/Projects/Flagship project 1 [Knowledgebase saas]/index.html",
    "c:/Users/Sanjeev/Documents/Projects/Flagship project 1 [Knowledgebase saas]/src/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc7fb',
          400: '#36a9f7',
          500: '#0c8de4',
          600: '#0270c2',
          700: '#03599e',
          800: '#074b83',
          900: '#0c3f6e',
          950: '#082849',
        },
        slate: {
          850: '#151e2e',
          950: '#0b0f19',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 25px -5px rgba(12, 141, 228, 0.35)',
        'glow-lg': '0 0 40px -10px rgba(12, 141, 228, 0.45)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.25)',
      }
    },
  },
  plugins: [],
}
