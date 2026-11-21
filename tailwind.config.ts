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
        haze: 'var(--haze)',
        surface: 'var(--surface)',
        line: 'var(--line)',
        ink: {
          DEFAULT: 'var(--ink)',
          muted: 'var(--ink-muted)',
        },
        sky: {
          DEFAULT: 'var(--sky)',
          deep: 'var(--sky-deep)',
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
        display: ['var(--font-display)', 'var(--font-bricolage)', 'ui-sans-serif', 'system-ui'],
        body: ['var(--font-body)', 'var(--font-mukta)', 'ui-sans-serif', 'system-ui', 'Noto Sans Devanagari'],
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
