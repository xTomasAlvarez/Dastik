/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', 'sans-serif'],
        heading: ['"Syne"', 'sans-serif'],
      },
      colors: {
        background: '#000000',
        card: '#090909',
        panel: '#111111',
        border: '#333333',
        subtle: '#222222',
        foreground: '#FAFAFA',
        muted: '#71717A',
      },
      borderRadius: {
        DEFAULT: '0px',
        none: '0px',
        sm: '2px',
      },
      boxShadow: {
        none: 'none',
      },
    },
  },
  plugins: [],
};
