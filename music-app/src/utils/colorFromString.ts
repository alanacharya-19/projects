export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function getColorsFromSeed(seed: string): { bg: string; accent: string; text: string } {
  const hash = hashString(seed);
  const hue = hash % 360;
  const accentHue = (hue + 40 + (hash % 60)) % 360;
  const isLight = hue > 30 && hue < 200;
  const bg = hslToHex(hue, isLight ? 35 : 45, isLight ? 75 : 35);
  const accent = hslToHex(accentHue, isLight ? 40 : 50, isLight ? 65 : 25);
  const text = isLight ? '#1a1a1a' : '#ffffff';
  return { bg, accent, text };
}

export function getInitials(str: string): string {
  const parts = str.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return str.slice(0, 2).toUpperCase();
}
