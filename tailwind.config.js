/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ahal: {
          50: '#f0f9f0',
          100: '#d8f0d8',
          200: '#b3e2b3',
          300: '#80cc80',
          400: '#4db84d',
          500: '#2d8f2d',
          600: '#1f6e1f',
          700: '#1a5a1a',
          800: '#174817',
          900: '#143b14',
          950: '#0a210a',
        },
      },
    },
  },
  plugins: [],
}
