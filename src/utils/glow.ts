import React from 'react';

export interface GlowConfig {
  color: string;
  intensity: number; // 0 - 100
  spread?: number; // 10 - 100
  toggles: {
    headline: boolean;
    highlightBox: boolean;
    logo: boolean;
    badge: boolean;
    footer: boolean;
  };
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16) || 0;
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function getTextGlowStyle(glow?: GlowConfig, enabled: boolean = false): React.CSSProperties {
  if (!glow || !enabled || glow.intensity <= 0) return {};
  const { r, g, b } = hexToRgb(glow.color || '#FFFFFF');
  const scale = glow.intensity / 100;
  const spreadScale = Math.max(0.2, (glow.spread || 50) / 50);
  const shadow1 = `0 0 ${Math.round(8 * spreadScale)}px rgba(${r}, ${g}, ${b}, ${(0.55 * scale).toFixed(3)})`;
  const shadow2 = `0 0 ${Math.round(24 * spreadScale)}px rgba(${r}, ${g}, ${b}, ${(0.35 * scale).toFixed(3)})`;
  const shadow3 = `0 0 ${Math.round(48 * spreadScale)}px rgba(${r}, ${g}, ${b}, ${(0.20 * scale).toFixed(3)})`;
  return {
    textShadow: `${shadow1}, ${shadow2}, ${shadow3}`,
  };
}

export function getBoxGlowStyle(glow?: GlowConfig, enabled: boolean = false): React.CSSProperties {
  if (!glow || !enabled || glow.intensity <= 0) return {};
  const { r, g, b } = hexToRgb(glow.color || '#FFFFFF');
  const scale = glow.intensity / 100;
  const spreadScale = Math.max(0.2, (glow.spread || 50) / 50);
  const shadow1 = `0 0 ${Math.round(20 * spreadScale)}px rgba(${r}, ${g}, ${b}, ${(0.60 * scale).toFixed(3)})`;
  const shadow2 = `0 0 ${Math.round(50 * spreadScale)}px rgba(${r}, ${g}, ${b}, ${(0.30 * scale).toFixed(3)})`;
  return {
    boxShadow: `${shadow1}, ${shadow2}`,
  };
}

export function getDropShadowFilter(glow?: GlowConfig, enabled: boolean = false): React.CSSProperties {
  if (!glow || !enabled || glow.intensity <= 0) return {};
  const { r, g, b } = hexToRgb(glow.color || '#FFFFFF');
  const scale = glow.intensity / 100;
  const spreadScale = Math.max(0.2, (glow.spread || 50) / 50);
  const filter1 = `drop-shadow(0 0 ${Math.round(10 * spreadScale)}px rgba(${r}, ${g}, ${b}, ${(0.70 * scale).toFixed(3)}))`;
  const filter2 = `drop-shadow(0 0 ${Math.round(24 * spreadScale)}px rgba(${r}, ${g}, ${b}, ${(0.30 * scale).toFixed(3)}))`;
  return {
    filter: `${filter1} ${filter2}`,
  };
}
