/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cinema: {
          50: '#fef7f0',
          100: '#fdeee0',
          200: '#fad3b8',
          300: '#f7b390',
          400: '#f18e5f',
          500: '#e96e3d',
          600: '#d55527',
          700: '#b24020',
          800: '#913320',
          900: '#762b1e',
        },
        film: {
          50: '#eff9ff',
          100: '#def1ff',
          200: '#b5e6ff',
          300: '#74d4ff',
          400: '#2bbfff',
          500: '#06a6f1',
          600: '#0085ce',
          700: '#006aa7',
          800: '#035a89',
          900: '#0a4a72',
        },
        charcoal: {
          50: '#f6f7f8',
          100: '#eaecef',
          200: '#d9dde2',
          300: '#bfc5cd',
          400: '#9ea7b3',
          500: '#828d9c',
          600: '#6c778a',
          700: '#5a6370',
          800: '#4c535e',
          900: '#42474f',
        },
        // Warm Amber
        amber: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Outfit', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'cinema': '0 4px 14px 0 rgba(233, 110, 61, 0.15)',
        'film': '0 4px 14px 0 rgba(6, 166, 241, 0.15)',
        'soft': '0 2px 8px 0 rgba(0, 0, 0, 0.06)',
        'medium': '0 4px 12px 0 rgba(0, 0, 0, 0.1)',
        'hard': '0 8px 24px 0 rgba(0, 0, 0, 0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'float': 'float 6s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}