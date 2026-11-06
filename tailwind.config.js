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
        // Extended palette from the front-end mocks
        creamdark: '#F2EFE8',
        ink: '#1F3A3D',
        inkdark: '#142629',
        deepteal: '#2E6E73',
        butter: '#F4D8A8',
        mist: '#E8F1EF',
      },
      fontFamily: {
        // Currently Fraunces (display) + Inter (body) — see Brand & Identity tab
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'ui-monospace', 'monospace'],
      },
      backgroundImage: {
        'kindred-gradient': 'linear-gradient(135deg, #8FC9B5 0%, #5BA9B8 50%, #7BB3D6 100%)',
        'kindred-gradient-soft':
          'linear-gradient(135deg, rgba(143,201,181,0.15) 0%, rgba(123,179,214,0.15) 100%)',
      },
      maxWidth: {
        kindred: '1400px',
      },
    },
  },
  plugins: [],
};
