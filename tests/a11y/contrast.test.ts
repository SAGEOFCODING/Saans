import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * WCAG 2.1 Relative Luminance calculation
 * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
export function sRGBtoLinear(val8bit: number): number {
  const s = val8bit / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function parseHexColor(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16),
      g: parseInt(clean[1] + clean[1], 16),
      b: parseInt(clean[2] + clean[2], 16),
    };
  }
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  };
}

export function getRelativeLuminance(hex: string): number {
  const { r, g, b } = parseHexColor(hex);
  const rLin = sRGBtoLinear(r);
  const gLin = sRGBtoLinear(g);
  const bLin = sRGBtoLinear(b);
  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
}

/**
 * WCAG 2.1 Contrast Ratio calculation
 * (L1 + 0.05) / (L2 + 0.05) where L1 is lighter, L2 is darker
 * Result is in [1, 21]
 */
export function getContrastRatio(foreground: string, background: string): number {
  const l1 = getRelativeLuminance(foreground);
  const l2 = getRelativeLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Design tokens from docs/design-system.md §4
export const LIGHT_TOKENS = {
  haze: '#EDF0F1',
  surface: '#FFFFFF',
  line: '#CBD5DA',
  ink: '#10222B',
  inkMuted: '#4A5C66',
  sky: '#0E6E8C',
  skyDeep: '#0A4C61',
  onSky: '#FFFFFF',
  gain: '#17794A',
  caution: '#8A5A00',
  dangerText: '#9B1C1C',
};

export const DARK_TOKENS = {
  haze: '#0C1A21',
  surface: '#14262F',
  line: '#2B414C',
  ink: '#E8EEF0',
  inkMuted: '#A9BAC2',
  sky: '#5CC0DE',
  skyDeep: '#8ED3E8',
  onSky: '#071217',
  gain: '#2EB35A',
  caution: '#F59338',
  dangerText: '#F87171',
};

export const AQI_LIGHT_SCALE = [
  { category: 'good', strong: '#1B7F3B', text: '#FFFFFF', tint: '#E3F3E7' },
  { category: 'satisfactory', strong: '#4F7A12', text: '#FFFFFF', tint: '#EAF1DC' },
  { category: 'moderate', strong: '#F2C230', text: '#1F1A00', tint: '#FBF1CB' },
  { category: 'poor', strong: '#E8730C', text: '#1A1A1A', tint: '#FCE3CC' },
  { category: 'very-poor', strong: '#C62828', text: '#FFFFFF', tint: '#F8D9D9' },
  { category: 'severe', strong: '#7B1E3A', text: '#FFFFFF', tint: '#EBD3DB' },
];

export const AQI_DARK_SCALE = [
  { category: 'good', color: '#2EB35A' },
  { category: 'satisfactory', color: '#7BB829' },
  { category: 'moderate', color: '#F7D566' },
  { category: 'poor', color: '#F59338' },
  { category: 'very-poor', color: '#F87171' },
  { category: 'severe', color: '#DE537E' },
];

describe('WCAG 2.1 Luminance and Contrast Mathematical Engine', () => {
  it('calculates correct relative luminance boundary conditions (black=0, white=1)', () => {
    expect(getRelativeLuminance('#000000')).toBe(0);
    expect(getRelativeLuminance('#FFFFFF')).toBeCloseTo(1.0, 4);
  });

  it('calculates contrast ratio extremes (21:1 for black-white, 1:1 for identical)', () => {
    expect(getContrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21.0, 1);
    expect(getContrastRatio('#123456', '#123456')).toBeCloseTo(1.0, 4);
  });
});

describe('Design System §4 Light Mode Contrast Conformance (WCAG 2.1 AA)', () => {
  describe('Normal Text Requirements (>= 4.5:1)', () => {
    it('primary text (--ink) has sufficient contrast on surface and haze', () => {
      const onSurface = getContrastRatio(LIGHT_TOKENS.ink, LIGHT_TOKENS.surface);
      const onHaze = getContrastRatio(LIGHT_TOKENS.ink, LIGHT_TOKENS.haze);
      expect(onSurface).toBeGreaterThanOrEqual(4.5);
      expect(onHaze).toBeGreaterThanOrEqual(4.5);
      expect(onSurface).toBeGreaterThan(14.0);
    });

    it('secondary text (--ink-muted) has sufficient contrast on surface and haze', () => {
      const onSurface = getContrastRatio(LIGHT_TOKENS.inkMuted, LIGHT_TOKENS.surface);
      const onHaze = getContrastRatio(LIGHT_TOKENS.inkMuted, LIGHT_TOKENS.haze);
      expect(onSurface).toBeGreaterThanOrEqual(4.5);
      expect(onHaze).toBeGreaterThanOrEqual(4.5);
    });

    it('brand link & action text (--sky) has sufficient contrast on surface and haze', () => {
      const onSurface = getContrastRatio(LIGHT_TOKENS.sky, LIGHT_TOKENS.surface);
      const onHaze = getContrastRatio(LIGHT_TOKENS.sky, LIGHT_TOKENS.haze);
      expect(onSurface).toBeGreaterThanOrEqual(4.5);
      expect(onHaze).toBeGreaterThanOrEqual(4.5);
    });

    it('primary button text (--on-sky) has sufficient contrast on button background (--sky)', () => {
      const ratio = getContrastRatio(LIGHT_TOKENS.onSky, LIGHT_TOKENS.sky);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('semantic tokens (--gain, --caution, --danger-text) meet normal text contrast (>= 4.5:1)', () => {
      const gainOnSurface = getContrastRatio(LIGHT_TOKENS.gain, LIGHT_TOKENS.surface);
      const gainOnHaze = getContrastRatio(LIGHT_TOKENS.gain, LIGHT_TOKENS.haze);
      const cautionOnSurface = getContrastRatio(LIGHT_TOKENS.caution, LIGHT_TOKENS.surface);
      const cautionOnHaze = getContrastRatio(LIGHT_TOKENS.caution, LIGHT_TOKENS.haze);
      const dangerOnSurface = getContrastRatio(LIGHT_TOKENS.dangerText, LIGHT_TOKENS.surface);
      const dangerOnHaze = getContrastRatio(LIGHT_TOKENS.dangerText, LIGHT_TOKENS.haze);

      expect(gainOnSurface).toBeGreaterThanOrEqual(4.5);
      expect(gainOnHaze).toBeGreaterThanOrEqual(4.5);
      expect(cautionOnSurface).toBeGreaterThanOrEqual(4.5);
      expect(cautionOnHaze).toBeGreaterThanOrEqual(4.5);
      expect(dangerOnSurface).toBeGreaterThanOrEqual(4.5);
      expect(dangerOnHaze).toBeGreaterThanOrEqual(4.5);
    });

    it('all 6 NAQI category badges meet text contrast on strong backgrounds (>= 4.5:1)', () => {
      for (const aqi of AQI_LIGHT_SCALE) {
        const ratio = getContrastRatio(aqi.text, aqi.strong);
        expect(
          ratio,
          `Category ${aqi.category} text ${aqi.text} on strong ${aqi.strong} must be >= 4.5:1`
        ).toBeGreaterThanOrEqual(4.5);
      }
    });

    it('primary text (--ink) on all 6 NAQI tint backgrounds meets contrast (>= 4.5:1)', () => {
      for (const aqi of AQI_LIGHT_SCALE) {
        const ratio = getContrastRatio(LIGHT_TOKENS.ink, aqi.tint);
        expect(
          ratio,
          `--ink on ${aqi.category} tint ${aqi.tint} must be >= 4.5:1`
        ).toBeGreaterThanOrEqual(4.5);
      }
    });
  });

  describe('Large Text and UI Controls / Focus Rings (>= 3.0:1)', () => {
    it('focus ring (--sky-deep) has strong UI non-text contrast on surface and haze', () => {
      const onSurface = getContrastRatio(LIGHT_TOKENS.skyDeep, LIGHT_TOKENS.surface);
      const onHaze = getContrastRatio(LIGHT_TOKENS.skyDeep, LIGHT_TOKENS.haze);
      expect(onSurface).toBeGreaterThanOrEqual(3.0);
      expect(onHaze).toBeGreaterThanOrEqual(3.0);
    });
  });
});

describe('Design System §4 Dark Mode Contrast Conformance (WCAG 2.1 AA)', () => {
  describe('Normal Text Requirements (>= 4.5:1)', () => {
    it('dark primary text (--ink) has sufficient contrast on surface and haze', () => {
      const onSurface = getContrastRatio(DARK_TOKENS.ink, DARK_TOKENS.surface);
      const onHaze = getContrastRatio(DARK_TOKENS.ink, DARK_TOKENS.haze);
      expect(onSurface).toBeGreaterThanOrEqual(4.5);
      expect(onHaze).toBeGreaterThanOrEqual(4.5);
    });

    it('dark secondary text (--ink-muted) has sufficient contrast on surface and haze', () => {
      const onSurface = getContrastRatio(DARK_TOKENS.inkMuted, DARK_TOKENS.surface);
      const onHaze = getContrastRatio(DARK_TOKENS.inkMuted, DARK_TOKENS.haze);
      expect(onSurface).toBeGreaterThanOrEqual(4.5);
      expect(onHaze).toBeGreaterThanOrEqual(4.5);
    });

    it('dark brand link & action text (--sky) has sufficient contrast on surface and haze', () => {
      const onSurface = getContrastRatio(DARK_TOKENS.sky, DARK_TOKENS.surface);
      const onHaze = getContrastRatio(DARK_TOKENS.sky, DARK_TOKENS.haze);
      expect(onSurface).toBeGreaterThanOrEqual(4.5);
      expect(onHaze).toBeGreaterThanOrEqual(4.5);
    });

    it('dark button text (--on-sky) has sufficient contrast on button background (--sky)', () => {
      const ratio = getContrastRatio(DARK_TOKENS.onSky, DARK_TOKENS.sky);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('dark semantic tokens (--gain, --caution, --danger-text) meet normal text contrast (>= 4.5:1)', () => {
      const gainOnSurface = getContrastRatio(DARK_TOKENS.gain, DARK_TOKENS.surface);
      const gainOnHaze = getContrastRatio(DARK_TOKENS.gain, DARK_TOKENS.haze);
      const cautionOnSurface = getContrastRatio(DARK_TOKENS.caution, DARK_TOKENS.surface);
      const cautionOnHaze = getContrastRatio(DARK_TOKENS.caution, DARK_TOKENS.haze);
      const dangerOnSurface = getContrastRatio(DARK_TOKENS.dangerText, DARK_TOKENS.surface);
      const dangerOnHaze = getContrastRatio(DARK_TOKENS.dangerText, DARK_TOKENS.haze);

      expect(gainOnSurface).toBeGreaterThanOrEqual(4.5);
      expect(gainOnHaze).toBeGreaterThanOrEqual(4.5);
      expect(cautionOnSurface).toBeGreaterThanOrEqual(4.5);
      expect(cautionOnHaze).toBeGreaterThanOrEqual(4.5);
      expect(dangerOnSurface).toBeGreaterThanOrEqual(4.5);
      expect(dangerOnHaze).toBeGreaterThanOrEqual(4.5);
    });
  });

  describe('Large Text and UI Controls / Focus Rings in Dark Mode (>= 3.0:1)', () => {
    it('dark focus ring (--sky-deep) has strong UI non-text contrast on surface and haze', () => {
      const onSurface = getContrastRatio(DARK_TOKENS.skyDeep, DARK_TOKENS.surface);
      const onHaze = getContrastRatio(DARK_TOKENS.skyDeep, DARK_TOKENS.haze);
      expect(onSurface).toBeGreaterThanOrEqual(3.0);
      expect(onHaze).toBeGreaterThanOrEqual(3.0);
    });

    it('all dark mode NAQI category indicators meet UI element contrast (>= 3.0:1) against surface', () => {
      for (const aqi of AQI_DARK_SCALE) {
        const ratio = getContrastRatio(aqi.color, DARK_TOKENS.surface);
        expect(
          ratio,
          `Dark category ${aqi.category} color ${aqi.color} on dark surface must be >= 3.0:1`
        ).toBeGreaterThanOrEqual(3.0);
      }
    });
  });
});

describe('CSS Variable Sync with globals.css', () => {
  it('confirms all color variables in globals.css match the tested tokens', () => {
    const cssPath = path.resolve(process.cwd(), 'src/app/globals.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    // Light tokens
    expect(cssContent).toContain('--haze: #EDF0F1');
    expect(cssContent).toContain('--surface: #FFFFFF');
    expect(cssContent).toContain('--ink: #10222B');
    expect(cssContent).toContain('--ink-muted: #4A5C66');
    expect(cssContent).toContain('--sky: #0E6E8C');
    expect(cssContent).toContain('--sky-deep: #0A4C61');
    expect(cssContent).toContain('--gain: #17794A');
    expect(cssContent).toContain('--caution: #8A5A00');
    expect(cssContent).toContain('--danger-text: #9B1C1C');

    // Dark tokens
    expect(cssContent).toContain('--haze: #0C1A21');
    expect(cssContent).toContain('--surface: #14262F');
    expect(cssContent).toContain('--ink: #E8EEF0');
    expect(cssContent).toContain('--ink-muted: #A9BAC2');
    expect(cssContent).toContain('--sky: #5CC0DE');
    expect(cssContent).toContain('--sky-deep: #8ED3E8');
    expect(cssContent).toContain('--danger-text: #F87171');
  });
});
