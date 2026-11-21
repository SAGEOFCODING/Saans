import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        haze: 'color-mix(in srgb, var(--haze) calc(100% * <alpha-value>), transparent)',
        surface: 'color-mix(in srgb, var(--surface) calc(100% * <alpha-value>), transparent)',
        line: 'color-mix(in srgb, var(--line) calc(100% * <alpha-value>), transparent)',
        ink: {
          DEFAULT: 'color-mix(in srgb, var(--ink) calc(100% * <alpha-value>), transparent)',
          muted: 'color-mix(in srgb, var(--ink-muted) calc(100% * <alpha-value>), transparent)',
        },
        sky: {
          DEFAULT: 'color-mix(in srgb, var(--sky) calc(100% * <alpha-value>), transparent)',
          deep: 'color-mix(in srgb, var(--sky-deep) calc(100% * <alpha-value>), transparent)',
          on: 'var(--on-sky)',
        },
        aqi: {
          good: 'var(--aqi-good)',
          satisfactory: 'var(--aqi-satisfactory)',
          moderate: 'var(--aqi-moderate)',
          poor: 'var(--aqi-poor)',
          verypoor: 'var(--aqi-verypoor)',
          'very-poor': 'var(--aqi-verypoor)',
          severe: 'var(--aqi-severe)',
        },
        gain: 'var(--gain)',
        caution: 'var(--caution)',
        'danger-text': 'var(--danger-text)',
      },
      fontFamily: {
        display: [
          '"Bricolage Grotesque"',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'sans-serif',
        ],
        body: [
          '"Mukta"',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          '"Noto Sans Devanagari"',
          'sans-serif',
        ],
        mono: [
          '"JetBrains Mono"',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      borderRadius: {
        hero: '24px',
        panel: '16px',
        control: '10px',
        chip: '9999px',
      },
    },
  },
  plugins: [],
};

export default config;
