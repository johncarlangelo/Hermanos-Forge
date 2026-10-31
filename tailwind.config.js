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
        // Precision Studio & Obsidian Design Tokens
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

        // Obsidian Subframe Studio Color Hierarchy
        obsidian: {
          950: '#0b0b10',
          900: '#0f0f16',
          850: '#12121a',
          800: '#14141d',
          750: '#1e1e2a',
          700: '#2a2a3a',
          600: '#3a3a4e',
        },
        accent: {
          violet: '#7c3aed',
          amethyst: '#c4b5fd',
          purple: '#8b5cf6',
          neon: '#a78bfa',
          cyan: '#38bdf8',
          glow: 'rgba(124, 58, 237, 0.25)',
        },

        // Backward compatibility mappings
        background: 'var(--bg-base)',
        surface: 'var(--surface-1)',
        primary: 'var(--accent-primary)',
        primaryHover: 'var(--accent-hover)',
        border: 'var(--border-subdued)',
      },
      fontFamily: {
        sans: ['DM Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'glow-violet': '0 0 25px -4px rgba(124, 58, 237, 0.45)',
        'glow-amethyst': '0 0 20px -3px rgba(196, 181, 253, 0.4)',
        'glow-cyan': '0 0 20px -3px rgba(56, 189, 248, 0.35)',
        'inner-glow': 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.08), inset 0 -1px 1px 0 rgba(0, 0, 0, 0.4)',
        'window-frame': '0 25px 65px -15px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(124, 58, 237, 0.18)',
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
