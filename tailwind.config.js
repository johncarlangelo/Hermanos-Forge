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

        // Obsidian Forge Color Hierarchy
        obsidian: {
          950: '#09090c',
          900: '#0e0e13',
          850: '#13131a',
          800: '#181824',
          750: '#1f1f2e',
          700: '#28283d',
          600: '#3d3d5c',
        },
        accent: {
          violet: '#9d4edd',
          amethyst: '#b5179e',
          purple: '#a855f7',
          neon: '#c084fc',
          cyan: '#00f0ff',
          glow: 'rgba(157, 78, 221, 0.25)',
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
        'glow-violet': '0 0 25px -4px rgba(157, 78, 221, 0.45)',
        'glow-amethyst': '0 0 20px -3px rgba(181, 23, 158, 0.4)',
        'glow-cyan': '0 0 20px -3px rgba(0, 240, 255, 0.35)',
        'inner-glow': 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.08), inset 0 -1px 1px 0 rgba(0, 0, 0, 0.4)',
        'window-frame': '0 25px 65px -15px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(168, 85, 247, 0.18)',
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
