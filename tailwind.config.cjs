/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['index.html', '**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: '#111827',
        secondary: '#6B7280',
        accent: {
          blue: '#3B82F6',
          green: '#10B981',
          red: '#EF4444',
          yellow: '#F59E0B',
          purple: '#8B5CF6',
        },
      },
    },
  },
  plugins: [],
  safelist: [
    'bg-gray-700',
    'bg-emerald-400',
    'bg-amber-400',
    'bg-blue-400',
  ],
};
