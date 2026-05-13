/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Kindred brand palette (from spreadsheet — locked in)
        sage: '#8FC9B5',
        teal: '#5BA9B8',
        sky: '#7BB3D6',
        coral: '#E89B85',
        cream: '#FBFAF6',
      },
      fontFamily: {
        // Currently Fraunces (display) + Inter (body) — see Brand & Identity tab
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'kindred-gradient': 'linear-gradient(135deg, #8FC9B5 0%, #5BA9B8 50%, #7BB3D6 100%)',
      },
    },
  },
  plugins: [],
};
