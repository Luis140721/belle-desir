/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bd-darkest': '#0D0818',
        'bd-dark': '#120B18',
        'bd-medium': '#1A0F24',
        'bd-border': '#2D1B4E',
        'bd-purple': '#5B2A86',
        'bd-purple-hover': '#7B3DAF',
        'bd-text': '#F5EDE1',
        'bd-muted': '#A89BC2',
        'bd-success': '#22C55E',
        'bd-error': '#EF4444',
        'bd-warning': '#F59E0B',
        'bd-info': '#3B82F6',
      },
    },
  },
  plugins: [],
}

