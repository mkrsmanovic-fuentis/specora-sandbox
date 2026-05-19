/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter Tight"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        bg: 'var(--bg)',
        'bg-2': 'var(--bg-2)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        'surface-hi': 'var(--surface-hi)',
        line: 'var(--line)',
        'line-soft': 'var(--line-soft)',
        fg: 'var(--fg)',
        'fg-2': 'var(--fg-2)',
        'fg-3': 'var(--fg-3)',
        'fg-4': 'var(--fg-4)',
        accent: 'var(--accent)',
        'accent-fg': 'var(--accent-fg)',
        'accent-dim': 'var(--accent-dim)',
        ok: 'var(--ok)',
        warn: 'var(--warn)',
        danger: 'var(--danger)',
        info: 'var(--info)',
        orange: '#e5985a',
      },
      boxShadow: {
        'lg-soft': '0 12px 32px rgba(0,0,0,0.32), 0 2px 6px rgba(0,0,0,0.18)',
      },
    },
  },
  plugins: [],
};
