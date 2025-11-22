/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#009245',
          light: '#44CE85',
          dark: '#056733',
        },
      },
      fontFamily: {
        sans: ['Kantumruy', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

