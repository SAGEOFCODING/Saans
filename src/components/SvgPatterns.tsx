/**
 * Accessible SVG Pattern definitions and Category Shape helpers for NAQI scale.
 * Per docs/design-system.md §4 (Colour is never the only signal).
 */

export function SvgPatterns() {
  return (
    <svg aria-hidden="true" focusable="false" className="absolute w-0 h-0 overflow-hidden">
      <defs>
        {/* Good: Solid */}
        <pattern id="pat-solid" width="10" height="10" patternUnits="userSpaceOnUse">
          <rect width="10" height="10" fill="currentColor" opacity="0.15" />
        </pattern>

        {/* Satisfactory: Light dots */}
        <pattern id="pat-dots" width="8" height="8" patternUnits="userSpaceOnUse">
          <circle cx="4" cy="4" r="1.5" fill="currentColor" opacity="0.3" />
        </pattern>

        {/* Moderate: Diagonal lines */}
        <pattern id="pat-diagonal" width="8" height="8" patternUnits="userSpaceOnUse">
          <path d="M0,8 L8,0" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
        </pattern>

        {/* Poor: Cross-hatch */}
        <pattern id="pat-crosshatch" width="8" height="8" patternUnits="userSpaceOnUse">
          <path d="M0,0 L8,8 M8,0 L0,8" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
        </pattern>

        {/* Very Poor: Dense hatch */}
        <pattern id="pat-densehatch" width="4" height="4" patternUnits="userSpaceOnUse">
          <path d="M0,4 L4,0" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
        </pattern>

        {/* Severe: Solid + dots */}
        <pattern id="pat-solid-dots" width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" fill="currentColor" opacity="0.25" />
          <circle cx="4" cy="4" r="2" fill="currentColor" opacity="0.6" />
        </pattern>
      </defs>
    </svg>
  );
}

export const CATEGORY_ICONS: Record<string, string> = {
  good: '●',
  satisfactory: '◐',
  moderate: '▲',
  poor: '◆',
  'very-poor': '■',
  verypoor: '■',
  severe: '⬢',
};

export const CATEGORY_COLORS: Record<string, { bg: string; text: string; tint: string }> = {
  good: { bg: 'bg-[#1B7F3B]', text: 'text-[#1B7F3B]', tint: 'bg-[#E3F3E7]' },
  satisfactory: { bg: 'bg-[#4F7A12]', text: 'text-[#4F7A12]', tint: 'bg-[#EAF1DC]' },
  moderate: { bg: 'bg-[#F2C230]', text: 'text-[#8A5A00]', tint: 'bg-[#FBF1CB]' },
  poor: { bg: 'bg-[#E8730C]', text: 'text-[#E8730C]', tint: 'bg-[#FCE3CC]' },
  'very-poor': { bg: 'bg-[#C62828]', text: 'text-[#C62828]', tint: 'bg-[#F8D9D9]' },
  verypoor: { bg: 'bg-[#C62828]', text: 'text-[#C62828]', tint: 'bg-[#F8D9D9]' },
  severe: { bg: 'bg-[#7B1E3A]', text: 'text-[#7B1E3A]', tint: 'bg-[#EBD3DB]' },
};
