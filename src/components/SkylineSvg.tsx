import React from 'react';

interface SkylineSvgProps {
  pm25: number;
  visibilityKm?: number;
}

export function SkylineSvg({ pm25, visibilityKm }: SkylineSvgProps) {
  const hazeOpacity = Math.min(0.9, Math.max(0.05, pm25 / 250));

  const isFarVisible = visibilityKm !== undefined ? visibilityKm >= 4.0 : pm25 < 60;
  const isMidVisible = visibilityKm !== undefined ? visibilityKm >= 1.5 : pm25 < 150;
  const isNearVisible = true;

  return (
    <svg
      viewBox="0 0 800 200"
      className="w-full h-36 md:h-48 object-cover rounded-hero overflow-hidden"
      role="img"
      aria-label="Urban skyline with simulated smog haze density"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9BB8C5" />
          <stop offset="100%" stopColor="#D5DEE2" />
        </linearGradient>
        <linearGradient id="hazeGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C9D3D8" stopOpacity={hazeOpacity * 0.95} />
          <stop offset="70%" stopColor="#D8E1E4" stopOpacity={hazeOpacity} />
          <stop offset="100%" stopColor="#E2E9EC" stopOpacity={hazeOpacity * 0.8} />
        </linearGradient>
      </defs>

      {/* Sky backdrop */}
      <rect width="800" height="200" fill="url(#skyGrad)" />

      {/* Far Layer (4.0km high-rises) */}
      {isFarVisible && (
        <g fill="#7A939E" opacity="0.45" className="transition-opacity duration-500">
          <rect x="40" y="80" width="35" height="120" />
          <rect x="85" y="95" width="28" height="105" />
          <rect x="220" y="70" width="45" height="130" />
          <polygon points="242,50 220,70 265,70" />
          <rect x="420" y="85" width="40" height="115" />
          <rect x="580" y="75" width="50" height="125" />
          <rect x="640" y="90" width="30" height="110" />
          <rect x="710" y="80" width="40" height="120" />
        </g>
      )}

      {/* Mid Layer (1.5km India Gate monument & mid-rises) */}
      {isMidVisible && (
        <g fill="#506C78" opacity="0.65" className="transition-opacity duration-500">
          <rect x="120" y="105" width="50" height="95" />
          <rect x="180" y="120" width="35" height="80" />
          {/* Monument Archway silhouette */}
          <path d="M 320 200 L 320 110 L 370 110 L 370 200 L 358 200 L 358 145 C 358 135 332 135 332 145 L 332 200 Z" />
          <rect x="315" y="105" width="60" height="8" />
          <rect x="470" y="110" width="45" height="90" />
          <rect x="525" y="125" width="40" height="75" />
          <rect x="675" y="115" width="42" height="85" />
        </g>
      )}

      {/* Near Layer (0.5km low-rises, trees, lampposts) */}
      {isNearVisible && (
        <g fill="#243842" opacity="0.9">
          <rect x="0" y="150" width="80" height="50" />
          {/* Trees */}
          <circle cx="95" cy="165" r="18" />
          <rect x="92" y="165" width="6" height="35" />
          <circle cx="115" cy="170" r="14" />
          <rect x="275" y="145" width="38" height="55" />
          <circle cx="395" cy="168" r="16" />
          <rect x="392" y="168" width="6" height="32" />
          <rect x="405" y="155" width="60" height="45" />
          <circle cx="570" cy="165" r="20" />
          <rect x="567" y="165" width="6" height="35" />
          <rect x="730" y="148" width="70" height="52" />
          {/* Ground baseline */}
          <rect x="0" y="194" width="800" height="6" fill="#17272F" />
        </g>
      )}

      {/* Smog Haze Overlay */}
      <rect width="800" height="200" fill="url(#hazeGrad)" />
    </svg>
  );
}
