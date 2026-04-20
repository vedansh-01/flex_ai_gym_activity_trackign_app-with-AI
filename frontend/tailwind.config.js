/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: '#121212',
        surface: '#1A1A1A',
        primary: '#FF5722', // The orange accent
        textSecondary: '#A1A1AA', // gray-400
        borderLight: '#27272A', // gray-800
      },
      fontFamily: {
        inter: ['System'], // Fallback if custom fonts aren't loaded yet
      }
    },
  },
  plugins: [],
}
