/** @type {import('tailwindcss').Config} */
module.exports = {
  // NativeWind v4 uses the nativewind/preset
  presets: [require('nativewind/preset')],
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './context/**/*.{js,jsx,ts,tsx}',
    './hooks/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // VoteDecen brand accent
        accent: {
          DEFAULT: '#4f46e5', // indigo-600
          light: '#eef2ff',   // indigo-50
          dark: '#3730a3',    // indigo-800
        },
      },
      fontFamily: {
        mono: ['Courier', 'monospace'],
      },
    },
  },
  plugins: [],
};
