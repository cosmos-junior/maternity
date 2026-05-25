/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Map Tailwind to the existing CSS custom properties so
      // both systems share the same design tokens.
      colors: {
        primary:   'var(--primary)',
        'primary-dark': 'var(--primary-dark)',
        danger:    'var(--danger)',
        warning:   'var(--warning)',
        success:   'var(--success)',
        purple:    'var(--purple)',
        'bg-base':  'var(--bg-base)',
        'bg-card':  'var(--bg-card)',
        'bg-input': 'var(--bg-input)',
      },
      fontFamily: {
        body:    ['Inter', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'sans-serif'],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  corePlugins: {
    preflight: false,   // ← keeps all your existing vanilla CSS intact
  },
  plugins: [],
}
