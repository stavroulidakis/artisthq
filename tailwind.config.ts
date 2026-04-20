import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-body)'],
        display: ['var(--font-display)'],
        mono: ['var(--font-mono)'],
      },
      colors: {
        sea: {
          950: '#050d1a',
          900: '#0a1628',
          800: '#0f2040',
          700: '#152a54',
          600: '#1e3a6e',
          500: '#2a5298',
          400: '#4a7fc1',
          300: '#7aaee0',
        },
        terra: {
          600: '#c0392b',
          500: '#e74c3c',
          400: '#e8604c',
          300: '#f0876e',
          200: '#f4a896',
        },
        amber: {
          600: '#d97706',
          500: '#f59e0b',
          400: '#fbbf24',
          300: '#fcd34d',
        },
        stone: {
          900: '#1a1714',
          800: '#242017',
          700: '#2f2a1f',
          600: '#3d3728',
          500: '#6b6245',
          400: '#a09880',
          300: '#c4bca8',
          200: '#ddd8cc',
          100: '#f0ede6',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.35s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideIn: { from: { opacity: '0', transform: 'translateX(-8px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
      },
    },
  },
  plugins: [],
}
export default config
