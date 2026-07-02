import { getColorsFromSeed, hashString, getInitials } from './colorFromString';

export async function generatePlaceholderArtwork(seed: string): Promise<string> {
  const colors = getColorsFromSeed(seed);
  const bg = colors.bg.replace('#', '');
  const initials = getInitials(seed);
  return `https://placehold.co/300x300/${bg}/FFFFFF?text=${encodeURIComponent(initials)}&font=playfair-display`;
}
