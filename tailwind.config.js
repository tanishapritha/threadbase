/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './hooks/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'hsl(210, 40%, 55%)',
        secondary: 'hsl(210, 30%, 25%)',
        accent: 'hsl(210, 50%, 65%)',
        surface: 'hsl(210, 35%, 15%)',
        glass: 'rgba(255,255,255,0.07)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
