/**
 * civ-visual.ts — kolory wizualne cywilizacji (kolorHex z civs.json).
 * Jeden resolver → mapa, jednostki, miasta, dyplomacja.
 */
import type { CivsData } from '../data/loader';

/** Fallback paleta ownerId (kompatybilność wsteczna). */
export const OWNER_COLORS_FALLBACK: readonly number[] = [
  0xffd54a, // 0 = gracz (złoto)
  0xe53935, // 1 = czerwony
  0x43a047, // 2 = zielony
  0x1e88e5, // 3 = niebieski
  0xfb8c00, // 4 = pomarańcz
  0x8e24aa, // 5 = fiolet
  0x00acc1, // 6 = turkus
  0xf06292, // 7 = róż
];

const DEFAULT_CIV_COLOR_HEX = '#ffd54a';

/** Parsuje #RRGGBB / RRGGBB → liczba Three.js 0xRRGGBB. */
export function parseHexColor(hex: string): number {
  let h = hex.trim().replace(/^#/, '');
  if (h.length === 3) {
    h = h.split('').map((c) => c + c).join('');
  }
  if (!/^[0-9a-fA-F]{6}$/.test(h)) {
    return OWNER_COLORS_FALLBACK[0]!;
  }
  return parseInt(h, 16);
}

/** Zwraca #RRGGBB dla ikonaId; fallback na paletę lub domyślny złoty. */
export function civColorHex(civs: CivsData, ikonaId: string): string {
  const row = civs.cywilizacje.find((c) => c.ikonaId === ikonaId);
  const raw = row?.kolorHex?.trim();
  if (raw && /^#?[0-9a-fA-F]{3,8}$/.test(raw)) {
    const norm = raw.startsWith('#') ? raw : `#${raw}`;
    if (norm.length === 4) {
      const c = norm.slice(1);
      return `#${c[0]}${c[0]}${c[1]}${c[1]}${c[2]}${c[2]}`;
    }
    return norm.length === 7 ? norm : DEFAULT_CIV_COLOR_HEX;
  }
  const idx = civs.cywilizacje.findIndex((c) => c.ikonaId === ikonaId);
  if (idx >= 0) {
    const n = OWNER_COLORS_FALLBACK[idx % OWNER_COLORS_FALLBACK.length]!;
    return `#${n.toString(16).padStart(6, '0')}`;
  }
  return DEFAULT_CIV_COLOR_HEX;
}

/** Kolor Three.js dla ikonaId. */
export function civColorForIkonaId(civs: CivsData, ikonaId: string): number {
  return parseHexColor(civColorHex(civs, ikonaId));
}

/** Kolor właściciela — kolorHex cywilizacji lub stara paleta OWNER_COLORS. */
export function civColorForOwner(
  civs: CivsData,
  ownerId: number,
  civTypeForOwner: (ownerId: number) => string,
): number {
  const ikonaId = civTypeForOwner(ownerId);
  const row = civs.cywilizacje.find((c) => c.ikonaId === ikonaId);
  if (row?.kolorHex?.trim()) {
    return parseHexColor(row.kolorHex);
  }
  return OWNER_COLORS_FALLBACK[ownerId % OWNER_COLORS_FALLBACK.length]!;
}

/** CSS hex (#RRGGBB) dla właściciela — minimapa, HUD. */
export function civColorCssForOwner(
  civs: CivsData,
  ownerId: number,
  civTypeForOwner: (ownerId: number) => string,
): string {
  return civColorHex(civs, civTypeForOwner(ownerId));
}
