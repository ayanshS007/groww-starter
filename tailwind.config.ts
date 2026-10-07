import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';
import { ambienceCss, BLOB_ALPHA, blobAlphaVars, cssVars, dark, light, tailwindColors } from './src/styles/tokens';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      ...tailwindColors(),
    },
    fontFamily: {
      sans: [
        'system-ui',
        '-apple-system',
        '"Segoe UI"',
        'Roboto',
        '"Noto Sans"',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ],
    },
    fontSize: {
      xs: ['0.8125rem', { lineHeight: '1.25rem' }],
      sm: ['0.875rem', { lineHeight: '1.375rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      '5xl': ['3rem', { lineHeight: '1.05' }],
      '6xl': ['3.75rem', { lineHeight: '1.02' }],
    },
    extend: {
      borderRadius: {
        card: '20px',
        'card-sm': '16px',
        'card-lg': '24px',
      },
      // Padding that lifts a 22 px inline label to a 44 px tap target.
      spacing: { hit: '11px' },
      minHeight: { tap: '44px' },
      minWidth: { tap: '44px' },
      maxWidth: { content: '1200px', tablet: '600px' },
      transitionDuration: { DEFAULT: '180ms' },
      transitionTimingFunction: { DEFAULT: 'cubic-bezier(0, 0, 0.2, 1)' },
    },
  },
  plugins: [
    plugin(({ addBase }) => {
      // Market mood and time of day (Stage 6a) set data-mood / data-tod on <html>;
      // ambienceCss() turns each into variables. Dark rules come last so they win.
      const lightAmb = ambienceCss('light');
      const darkAmb = ambienceCss('dark');
      addBase({
        ':root': { ...cssVars(light), ...blobAlphaVars(BLOB_ALPHA.light), ...lightAmb[':root'], 'color-scheme': 'light dark' },
        ...Object.fromEntries(Object.entries(lightAmb).filter(([k]) => k !== ':root')),
        '@media (prefers-color-scheme: dark)': {
          ':root': { ...cssVars(dark), ...blobAlphaVars(BLOB_ALPHA.dark), ...darkAmb[':root'] },
          ...Object.fromEntries(Object.entries(darkAmb).filter(([k]) => k !== ':root')),
        },
      });
    }),
  ],
} satisfies Config;
