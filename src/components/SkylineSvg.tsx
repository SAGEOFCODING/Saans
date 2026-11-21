import React from 'react';

interface SkylineSvgProps {
  pm25: number;
  visibilityKm?: number;
}

export function SkylineSvg({ pm25, visibilityKm }: SkylineSvgProps) {
  const hazeOpacity = Math.min(0.92, Math.max(0.06, pm25 / 250));

  const isFarVisible = visibilityKm !== undefined ? visibilityKm >= 3.5 : pm25 < 75;
  const isMidVisible = visibilityKm !== undefined ? visibilityKm >= 1.2 : pm25 < 160;
  const isNearVisible = true;

  return (
    <svg
      viewBox="0 0 800 200"
      className="w-full h-36 md:h-48 object-cover rounded-panel overflow-hidden"
      role="img"
      aria-label="Urban skyline with simulated smog haze density"
      preserveAspectRatio="none"
    >
      <defs>
        {/* Soft atmospheric dawn/dusk sky gradient */}
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8FA8B5" />
          <stop offset="40%" stopColor="#B6C9D1" />
          <stop offset="100%" stopColor="#DEE5E8" />
        </linearGradient>

        {/* Smog haze overlay gradient */}
        <linearGradient id="hazeGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C2CDD2" stopOpacity={hazeOpacity * 0.95} />
          <stop offset="50%" stopColor="#D2DCE0" stopOpacity={hazeOpacity} />
          <stop offset="100%" stopColor="#E2E9EC" stopOpacity={hazeOpacity * 0.85} />
        </linearGradient>

        {/* Radial mist glow for sun diffusion in smog */}
        <radialGradient id="mistGlow" cx="68%" cy="25%" r="45%">
          <stop offset="0%" stopColor="#FFF9EB" stopOpacity={Math.max(0.2, 0.7 - hazeOpacity * 0.5)} />
          <stop offset="100%" stopColor="#FFF9EB" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Sky backdrop */}
      <rect width="800" height="200" fill="url(#skyGrad)" />
      {/* Diffused sun glow */}
      <circle cx="544" cy="50" r="120" fill="url(#mistGlow)" />

      {/* Far Layer (~4.0km modern towers, spires, telecomm tower) */}
      {isFarVisible && (
        <g fill="#7A939E" opacity="0.45" className="transition-opacity duration-700">
          {/* High-rise cluster 1 */}
          <rect x="40" y="82" width="28" height="118" rx="1" />
          <rect x="72" y="98" width="22" height="102" rx="1" />
          <rect x="98" y="110" width="30" height="90" rx="1" />

          {/* Slender communication needle */}
          <line x1="225" y1="52" x2="225" y2="80" stroke="#7A939E" strokeWidth="2" />
          <polygon points="225,50 216,80 234,80" />
          <rect x="212" y="80" width="26" height="120" rx="1" />

          {/* Stepped high-rise */}
          <rect x="360" y="85" width="36" height="115" rx="1" />
          <rect x="368" y="70" width="20" height="15" rx="1" />
          <line x1="378" y1="55" x2="378" y2="70" stroke="#7A939E" strokeWidth="1.5" />

          {/* Eastern district skyline */}
          <rect x="490" y="92" width="32" height="108" rx="1" />
          <polygon points="506,75 490,92 522,92" />
          <rect x="620" y="80" width="42" height="120" rx="1" />
          <rect x="668" y="95" width="26" height="105" rx="1" />
          <rect x="710" y="78" width="38" height="122" rx="1" />
          <line x1="729" y1="62" x2="729" y2="78" stroke="#7A939E" strokeWidth="2" />
        </g>
      )}

      {/* Mid Layer (~1.5km India Gate, Secretariat Domes, Qutub silhouette) */}
      {isMidVisible && (
        <g fill="#4E6975" opacity="0.68" className="transition-opacity duration-500">
          {/* Left block & trees */}
          <rect x="0" y="132" width="45" height="68" rx="1" />
          <rect x="135" y="112" width="48" height="88" rx="1" />
          <rect x="188" y="125" width="36" height="75" rx="1" />

          {/* Central India Gate Memorial Archway */}
          <g transform="translate(290, 0)">
            {/* Top entablature */}
            <rect x="20" y="104" width="70" height="8" rx="1" />
            <rect x="25" y="112" width="60" height="6" />
            {/* Pillars */}
            <rect x="22" y="118" width="18" height="82" />
            <rect x="70" y="118" width="18" height="82" />
            {/* Arch opening */}
            <path d="M 40 200 L 40 148 C 40 136 70 136 70 148 L 70 200 Z" fill="#8FA8B5" opacity="0.4" />
          </g>

          {/* Secretariat dome */}
          <path d="M 435 150 C 435 132 465 132 465 150 Z" />
          <rect x="448" y="124" width="4" height="10" />
          <rect x="428" y="150" width="44" height="50" rx="1" />

          {/* Mid-rise residential flats */}
          <rect x="530" y="120" width="54" height="80" rx="1" />
          <rect x="590" y="128" width="32" height="72" rx="1" />
          <rect x="650" y="116" width="46" height="84" rx="1" />
        </g>
      )}

      {/* Near Layer (~0.5km foreground streetscape, lush canopy, lampposts) */}
      {isNearVisible && (
        <g fill="#21333C" opacity="0.94">
          {/* Foreground perimeter wall */}
          <rect x="0" y="158" width="75" height="42" />

          {/* Trees with natural rounded crowns */}
          <ellipse cx="100" cy="166" rx="20" ry="17" />
          <rect x="97" y="166" width="6" height="34" />

          <ellipse cx="125" cy="170" rx="16" ry="14" />
          <rect x="122" y="170" width="5" height="30" />

          {/* Low residential apartment */}
          <rect x="245" y="148" width="42" height="52" rx="1" />
          <rect x="252" y="156" width="6" height="8" fill="#5A7480" opacity="0.6" />
          <rect x="264" y="156" width="6" height="8" fill="#5A7480" opacity="0.6" />
          <rect x="276" y="156" width="6" height="8" fill="#5A7480" opacity="0.6" />

          {/* Boulevard trees */}
          <ellipse cx="388" cy="167" rx="19" ry="16" />
          <rect x="385" y="167" width="6" height="33" />

          <rect x="402" y="155" width="55" height="45" rx="1" />
          <rect x="412" y="163" width="7" height="9" fill="#5A7480" opacity="0.6" />
          <rect x="425" y="163" width="7" height="9" fill="#5A7480" opacity="0.6" />
          <rect x="438" y="163" width="7" height="9" fill="#5A7480" opacity="0.6" />

          <ellipse cx="585" cy="165" rx="22" ry="18" />
          <rect x="582" y="165" width="6" height="35" />

          {/* Right street corner */}
          <rect x="715" y="150" width="85" height="50" rx="1" />

          {/* Ground baseline */}
          <rect x="0" y="196" width="800" height="4" fill="#132128" />
        </g>
      )}

      {/* Smog Haze Overlay Gradient that scales smoothly with PM2.5 */}
      <rect width="800" height="200" fill="url(#hazeGrad)" />
    </svg>
  );
}
