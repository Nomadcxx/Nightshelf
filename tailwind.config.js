const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
  content: ['components/**/*.vue', 'layouts/**/*.vue', 'pages/**/*.vue', 'mixins/**/*.js', 'plugins/**/*.js'],
  theme: {
    extend: {
      screens: {
        short: { raw: '(max-height: 500px)' }
      },
      colors: {
        bg: 'rgb(var(--color-bg) / <alpha-value>)',
        'bg-hover': 'rgb(var(--color-bg-hover) / <alpha-value>)',
        fg: 'rgb(var(--color-fg) / <alpha-value>)',
        'fg-muted': 'rgb(var(--color-fg-muted) / <alpha-value>)',
        secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        'bg-toggle': 'rgb(var(--color-bg-toggle) / <alpha-value>)',
        'bg-toggle-selected': 'rgb(var(--color-bg-toggle-selected) / <alpha-value>)',
        'track-cursor': 'rgb(var(--color-track-cursor) / <alpha-value>)',
        track: 'rgb(var(--color-track) / <alpha-value>)',
        'track-buffered': 'rgb(var(--color-track-buffered) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        error: 'rgb(var(--color-danger) / <alpha-value>)',
        info: 'rgb(var(--color-info) / <alpha-value>)',
        success: 'rgb(var(--color-success) / <alpha-value>)',
        successDark: 'rgb(var(--color-success) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)'
      },
      cursor: {
        none: 'none'
      },
      fontFamily: {
        sans: ['Inter', 'Source Sans Pro', ...defaultTheme.fontFamily.sans],
        mono: ['JetBrains Mono', 'Ubuntu Mono', ...defaultTheme.fontFamily.mono]
      },
      fontSize: {
        '1.5xl': '1.375rem',
        xxs: '0.625rem'
      },
      spacing: {
        18: '4.5rem'
      },
      height: {
        18: '4.5rem'
      },
      maxWidth: {
        24: '6rem'
      },
      minWidth: {
        4: '1rem',
        8: '2rem',
        10: '2.5rem',
        12: '3rem',
        16: '4rem'
      },
      minHeight: {
        12: '3rem'
      }
    }
  },
  plugins: []
}
