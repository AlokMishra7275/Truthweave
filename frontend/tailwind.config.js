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
        // Soft, grounding tones for trauma-informed design
        primary: '#2D5F6F', // Deep blue
        secondary: '#4A7C59', // Earth green
        accent: '#8B7355', // Warm brown
        background: '#F5F5F0', // Soft cream
        surface: '#FFFFFF',
        text: '#2C2C2C',
        sage: {
          50: '#f7f9f7',
          100: '#e8f0e8',
          200: '#d1e1d1',
          300: '#b3ccb3',
          400: '#8fb08f',
          500: '#6f8f6f',
          600: '#5a755a',
          700: '#495f49',
          800: '#3d4f3d',
          900: '#344034',
        },
      },
    },
  },
  plugins: [],
}