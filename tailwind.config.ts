import type { Config } from 'tailwindcss';

/**
 * Tailwind theme — consumes CSS vars defined in app/globals.css (which mirror
 * lib/design/tokens.ts). Per PRD §12.2, only color + font-family vary per
 * profile; spacing, type, motion, radius are locked here as theme constants.
 */
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './payload/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg:               'oklch(var(--bg) / <alpha-value>)',
        surface:          'oklch(var(--surface) / <alpha-value>)',
        border:           'oklch(var(--border) / <alpha-value>)',
        text:             'oklch(var(--text) / <alpha-value>)',
        'text-muted':     'oklch(var(--text-muted) / <alpha-value>)',
        accent:           'oklch(var(--accent) / <alpha-value>)',
        'accent-contrast':'oklch(var(--accent-contrast) / <alpha-value>)',
      },
      fontFamily: {
        display:   ['var(--font-display)',   'sans-serif'],
        body:      ['var(--font-body)',      'sans-serif'],
        editorial: ['var(--font-editorial)', 'serif'],
        sans:      ['var(--font-body)',      'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0',
        sharp:   '0',
      },
      transitionDuration: {
        quick: '140ms',
        base:  '240ms',
        slow:  '420ms',
      },
    },
  },
  plugins: [],
};

export default config;
