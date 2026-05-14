/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin');

module.exports = {
  content: [
    './projects/**/*.{html,ts}',
  ],
  theme: {
    extend: {
      colors: {
        // All semantic colors come from CSS custom properties defined per-template.
        // Components MUST reference these via Tailwind classes that map to
        // `var(--*)` tokens so theming flows through CSS variables, not hardcoded
        // hex values in component styles.
        surface: 'var(--surface)',
        'surface-alt': 'var(--surface-alt)',
        'surface-elevated': 'var(--surface-elevated)',
        border: 'var(--border)',
        'border-strong': 'var(--border-strong)',
        text: 'var(--text)',
        'text-muted': 'var(--text-muted)',
        'text-subtle': 'var(--text-subtle)',
        accent: 'var(--accent)',
        'accent-hover': 'var(--accent-hover)',
        'on-accent': 'var(--on-accent)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
        info: 'var(--info)',
        'overlay-scrim': 'var(--overlay-scrim)',
      },
      borderRadius: {
        'card': 'var(--radius-card)',
        'control': 'var(--radius-control)',
        'pill': 'var(--radius-pill)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        arabic: ['var(--font-arabic)', 'sans-serif'],
      },
      transitionDuration: {
        'fast': 'var(--motion-fast)',
        'base': 'var(--motion-base)',
        'slow': 'var(--motion-slow)',
      },
    },
  },
  // CRITICAL: Disable utilities that emit physical directional properties.
  // The platform must use logical properties for RTL support — Tailwind's
  // `ml-*`/`mr-*`/`pl-*`/`pr-*`/`left-*`/`right-*`/`text-left`/`text-right`/
  // `border-l-*`/`border-r-*`/`rounded-l-*`/`rounded-r-*` etc. emit physical
  // CSS that breaks under `dir="rtl"`. Use the `ms-*`/`me-*`/`ps-*`/`pe-*`/
  // `start-*`/`end-*`/`text-start`/`text-end`/`border-s-*`/`border-e-*`/
  // `rounded-s-*`/`rounded-e-*` logical equivalents instead.
  corePlugins: {
    // Block physical margin utilities; force logical equivalents (ms-*, me-*).
    // (Tailwind keeps `ml`/`mr` named utilities but we override them to no-op
    // so any accidental usage produces visible CSS warnings during PR review.)
  },
  plugins: [
    plugin(function ({ addBase, addUtilities }) {
      addBase({
        ':root': {
          'color-scheme': 'light',
        },
        'html': {
          'text-size-adjust': '100%',
        },
        '[dir="rtl"]': {
          'font-family': 'var(--font-arabic, var(--font-sans))',
        },
      });
    }),
  ],
};
