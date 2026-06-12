/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--bg)',
        surface: 'var(--surface)',
        surfaceHover: 'var(--surface-hover)',
        primary: 'var(--primary)',
        primaryHover: 'var(--primary-hover)',
        textPrimary: 'var(--text-primary)',
        textSecondary: 'var(--text-secondary)',
        border: 'var(--border)'
      }
    },
  },
  plugins: [],
}
