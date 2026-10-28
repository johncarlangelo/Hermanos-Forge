/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Precision Studio Design Tokens
        bgBase: 'var(--bg-base)',
        surface1: 'var(--surface-1)',
        surface2: 'var(--surface-2)',
        surfaceHover: 'var(--surface-hover)',
        borderSubdued: 'var(--border-subdued)',
        borderStrong: 'var(--border-strong)',
        textPrimary: 'var(--text-primary)',
        textSecondary: 'var(--text-secondary)',
        textTertiary: 'var(--text-tertiary)',
        accentPrimary: 'var(--accent-primary)',
        accentHover: 'var(--accent-hover)',
        accentMuted: 'var(--accent-muted)',
        statusSuccess: 'var(--status-success)',
        statusWarning: 'var(--status-warning)',
        statusDanger: 'var(--status-danger)',
        statusInfo: 'var(--status-info)',

        // Backward compatibility mappings
        background: 'var(--bg-base)',
        surface: 'var(--surface-1)',
        primary: 'var(--accent-primary)',
        primaryHover: 'var(--accent-hover)',
        border: 'var(--border-subdued)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'Menlo', 'monospace'],
      },
      borderRadius: {
        xs: '4px',
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
    },
  },
  plugins: [],
}
