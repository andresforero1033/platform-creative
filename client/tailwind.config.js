/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        'brand-blue': '#1677ff',
        'brand-purple': '#6d4eff',
        'brand-yellow': '#ffcc00',
        edu: {
          blue: '#1677ff',
          violet: '#6d4eff',
          yellow: '#ffcc00',
          ink: '#0f172a',
          cloud: '#f8fbff',
        },
      },
      boxShadow: {
        glow: '0 14px 40px rgba(109, 78, 255, 0.32)',
      },
      backgroundImage: {
        'hero-grid': 'radial-gradient(circle at 1px 1px, rgba(109,78,255,0.2) 1px, transparent 0)',
      },
    },
  },
  plugins: [],
}

