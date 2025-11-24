/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,html}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        figma: {
          bg: 'var(--figma-color-bg)',
          'bg-secondary': 'var(--figma-color-bg-secondary)',
          'bg-tertiary': 'var(--figma-color-bg-tertiary)',
          text: 'var(--figma-color-text)',
          'text-secondary': 'var(--figma-color-text-secondary)',
          'text-tertiary': 'var(--figma-color-text-tertiary)',
          border: 'var(--figma-color-border)',
          'brand': 'var(--figma-color-bg-brand)',
          'brand-secondary': 'var(--figma-color-bg-brand-secondary)',
        },
      },
      fontSize: {
        '2xs': ['10px', '14px'],
      },
    },
  },
  plugins: [],
};
