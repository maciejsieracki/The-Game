/**
 * C-TEREN-IMPL-3=B — składowe wiersza TEREN w tooltipie jednostki bitwy.
 * Czysta logika (bez DOM / THREE) — testowalna z node.
 */
import {
  terrainDefenseMultiplier,
  terrainRangeDelta,
  cavalryTerrainMultiplier,
} from '../game/combat';
import type { TerrainEntry } from '../game/combat';

export type TerrainTerenColor = '#e08a8a' | '#7ad0a0' | '#e8c878';

export interface TerrainTerenPart {
  text: string;
  color: TerrainTerenColor;
}

export interface BuildTerrainTerenTooltipOpts {
  terrain: string;
  onWallWalkway: boolean;
  onFord: boolean;
  onShore: boolean;
  rangedUnit: boolean;
  isCatapult: boolean;
  rangeBase: number;
  mounted: boolean;
  /** Koszt wejścia dla TEJ jednostki (Infinity = niedostępne). */
  moveCost: number;
  /** Bazowy koszt terenu dla piechoty. */
  baseMoveCost: number;
  terrainData: TerrainEntry[];
}

/** Buduje listę efektów terenu na bieżącym heksie jednostki. */
export function buildTerrainTerenTooltipParts(
  opts: BuildTerrainTerenTooltipOpts,
): TerrainTerenPart[] {
  const parts: TerrainTerenPart[] = [];
  if (opts.onWallWalkway) return parts;

  const terrain = opts.terrain;

  if (opts.onFord) {
    parts.push({ text: 'W brodzie: −25% atak/obrona, ruch ×0,5', color: '#e08a8a' });
  } else if (opts.onShore) {
    parts.push({ text: 'Obrona brzegu: +15% obrony', color: '#7ad0a0' });
  }

  const terrNorm = terrain.toLowerCase();
  const defVsWrecz = terrainDefenseMultiplier(terrain, 'Wrecz', opts.terrainData);
  const defVsDist = terrainDefenseMultiplier(terrain, 'Dystans', opts.terrainData);
  if (terrNorm.includes('las') && defVsDist > 1.001) {
    const pct = Math.round((defVsDist - 1) * 100);
    parts.push({ text: `Obrona broniącego: +${pct}% vs dystans`, color: '#7ad0a0' });
  } else if (defVsWrecz > 1.001) {
    const pct = Math.round((defVsWrecz - 1) * 100);
    parts.push({ text: `Obrona broniącego: +${pct}%`, color: '#7ad0a0' });
  }

  if (opts.rangedUnit && !opts.isCatapult && opts.rangeBase > 0) {
    const delta = terrainRangeDelta(terrain, opts.terrainData);
    if (delta !== 0) {
      parts.push({
        text: `Zasięg (dystans): ${delta > 0 ? '+' : ''}${delta} hex`,
        color: delta > 0 ? '#7ad0a0' : '#e08a8a',
      });
    }
  }

  if (!Number.isFinite(opts.moveCost)) {
    const label = opts.mounted ? 'Przejazd (konnica): NIEDOSTĘPNE' : 'Przejazd: NIEDOSTĘPNE';
    parts.push({ text: label, color: '#e08a8a' });
  } else if (opts.mounted) {
    const mult = cavalryTerrainMultiplier(terrain, opts.terrainData);
    if (mult > 1 && Number.isFinite(mult)) {
      parts.push({
        text: `Koszt ruchu (konnica): ${opts.moveCost} pkt (×${mult})`,
        color: '#e8c878',
      });
    } else if (opts.baseMoveCost > 1) {
      parts.push({ text: `Koszt ruchu: ${opts.moveCost} pkt`, color: '#e8c878' });
    }
  } else if (opts.baseMoveCost > 1) {
    parts.push({ text: `Koszt ruchu: ${opts.moveCost} pkt`, color: '#e8c878' });
  }

  return parts;
}

/** Kolor łączony dla jednego wiersza TEREN (priorytet: czerwony > żółty > zielony). */
export function terrainTerenTooltipColor(parts: TerrainTerenPart[]): string {
  if (parts.some((p) => p.color === '#e08a8a')) return '#e08a8a';
  if (parts.some((p) => p.color === '#e8c878')) return '#e8c878';
  return '#7ad0a0';
}
