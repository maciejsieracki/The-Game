/**
 * map-gen-params-loader.ts — odczyt Panel-A (`gra/data/map-gen-params.json`).
 * Fallback = dotychczasowe stałe w kodzie (batch F-MAP-GEN-PARAMS).
 */
import raw from '../../data/map-gen-params.json';

type DensityTier = 'low' | 'medium' | 'high';
type RozmiarSwiata = 'malenki' | 'maly' | 'standardowy' | 'duzy' | 'ogromny' | 'superogromny';
type MapSizeLabel = 'mala' | 'srednia' | 'duza' | 'ogromna' | 'super';

const FALLBACK_ROZMIAR: Record<RozmiarSwiata, [number, number]> = {
  malenki:     [76,  52],
  maly:        [108, 74],
  standardowy: [168, 120],
  duzy:        [240, 168],
  ogromny:     [336, 238],
  superogromny: [672, 476],
};

const FALLBACK_SIGHT = 3;
const FALLBACK_RESOURCE_MULT: Record<DensityTier, number> = { low: 0.6, medium: 1.0, high: 1.4 };
const FALLBACK_BASELINE_RARITY = 1.35;
const FALLBACK_RIVERS: Record<DensityTier, number> = { low: 20, medium: 50, high: 120 };
const FALLBACK_RIVER_SCALE: Record<MapSizeLabel, number> = {
  mala: 1, srednia: 1.35, duza: 1.7, ogromna: 2.1, super: 2.6,
};
const FALLBACK_DESERT: Record<DensityTier, number> = { low: 0.68, medium: 0.63, high: 0.58 };
const FALLBACK_FOREST: Record<DensityTier, number> = { low: 0.65, medium: 0.58, high: 0.50 };
const FALLBACK_MOUNTAIN: Record<DensityTier, number> = { low: 0.80, medium: 0.68, high: 0.52 };
const FALLBACK_HIGHLAND: Record<DensityTier, number> = { low: 0.66, medium: 0.50, high: 0.38 };
const FALLBACK_AKTYWNE_TYPY: Record<MapSizeLabel, number> = {
  mala: 3, srednia: 5, duza: 7, ogromna: 9, super: 11,
};
const FALLBACK_RYWALE: Record<MapSizeLabel, number> = {
  mala: 2, srednia: 4, duza: 6, ogromna: 8, super: 10,
};
const FALLBACK_METAL_ERA: Record<string, number> = { miedz: 2, zelazo: 3 };
const FALLBACK_DEPOSIT_RARITY: Partial<Record<string, number>> = {
  miedz: 0.10, zelazo: 0.08, glina: 0.10, konie: 0.10, wegiel: 0.10,
  owce: 0.08, bydlo: 0.07, sol: 0.12,
};

function tierKey(t: DensityTier): 'low' | 'medium' | 'high' {
  return t;
}

/** Domyślny promień wzroku jednostki / miasta (mgła). */
export function mapGenDefaultSight(): number {
  const v = (raw as { mgla?: { default_sight_jednostki?: { wartosc?: number } } })
    .mgla?.default_sight_jednostki?.wartosc;
  return typeof v === 'number' && v > 0 ? v : FALLBACK_SIGHT;
}

export function mapGenResourceMult(tier: DensityTier): number {
  const m = (raw as { gestosc?: { surowce_mult?: Record<string, number> } }).gestosc?.surowce_mult;
  return m?.[tierKey(tier)] ?? FALLBACK_RESOURCE_MULT[tier];
}

export function mapGenResourceBaselineRarity(): number {
  const v = (raw as { gestosc?: { baseline_rarity_mult?: number } }).gestosc?.baseline_rarity_mult;
  return typeof v === 'number' && v > 0 ? v : FALLBACK_BASELINE_RARITY;
}

export function mapGenMaxRiversBase(tier: DensityTier): number {
  const g = (raw as { gestosc?: { rzeki_max_mala_mapa?: Record<string, number> } }).gestosc?.rzeki_max_mala_mapa;
  const k = tierKey(tier);
  if (g && typeof g[k] === 'number') return g[k]!;
  return FALLBACK_RIVERS[tier];
}

export function mapGenRiverScale(size: MapSizeLabel): number {
  const rs = (raw as { gestosc?: { river_scale?: Record<string, number> } }).gestosc?.river_scale;
  const lut: Record<MapSizeLabel, string> = {
    mala: 'mala', srednia: 'srednia', duza: 'duza', ogromna: 'ogromna', super: 'super',
  };
  const v = rs?.[lut[size]];
  return typeof v === 'number' && v > 0 ? v : FALLBACK_RIVER_SCALE[size];
}

export function mapGenDesertThreshold(tier: DensityTier): number {
  const d = (raw as { gestosc?: { desert_noise_threshold?: Record<string, number> } }).gestosc?.desert_noise_threshold;
  const k = tierKey(tier);
  if (d && typeof d[k] === 'number') return d[k]!;
  return FALLBACK_DESERT[tier];
}

export function mapGenForestThreshold(tier: DensityTier): number {
  const f = (raw as { gestosc?: { forest_noise_threshold?: Record<string, number> } }).gestosc?.forest_noise_threshold;
  const k = tierKey(tier);
  if (f && typeof f[k] === 'number') return f[k]!;
  return FALLBACK_FOREST[tier];
}

export function mapGenMountainThreshold(tier: DensityTier): number {
  const m = (raw as { gestosc?: { mountain_noise_threshold?: Record<string, number> } }).gestosc?.mountain_noise_threshold;
  const k = tierKey(tier);
  if (m && typeof m[k] === 'number') return m[k]!;
  return FALLBACK_MOUNTAIN[tier];
}

export function mapGenHighlandThreshold(tier: DensityTier): number {
  const h = (raw as { gestosc?: { highland_noise_threshold?: Record<string, number> } }).gestosc?.highland_noise_threshold;
  const k = tierKey(tier);
  if (h && typeof h[k] === 'number') return h[k]!;
  return FALLBACK_HIGHLAND[tier];
}

export function mapGenAktywneTypy(size: MapSizeLabel): number {
  const m = (raw as { mapa_skala?: { aktywne_typy?: Record<string, number> } }).mapa_skala?.aktywne_typy;
  const lut: Record<MapSizeLabel, string> = {
    mala: 'mala', srednia: 'srednia', duza: 'duza', ogromna: 'ogromna', super: 'super',
  };
  const v = m?.[lut[size]];
  return typeof v === 'number' && v > 0 ? v : FALLBACK_AKTYWNE_TYPY[size];
}

export function mapGenDefaultRywale(size: MapSizeLabel): number {
  const m = (raw as { mapa_skala?: { domyslni_rywale?: Record<string, number> } }).mapa_skala?.domyslni_rywale;
  const lut: Record<MapSizeLabel, string> = {
    mala: 'mala', srednia: 'srednia', duza: 'duza', ogromna: 'ogromna', super: 'super',
  };
  const v = m?.[lut[size]];
  return typeof v === 'number' && v >= 0 ? v : FALLBACK_RYWALE[size];
}

/** Wymiary hex z Panel-A (brak klucza → fallback kodu). */
export function mapGenRozmiarDims(): Record<RozmiarSwiata, [number, number]> {
  const src = (raw as { generator?: { rozmiar_dims?: Record<string, number[]> } }).generator?.rozmiar_dims;
  const out = { ...FALLBACK_ROZMIAR };
  if (!src) return out;
  for (const key of Object.keys(out) as RozmiarSwiata[]) {
    const pair = src[key];
    if (Array.isArray(pair) && pair.length >= 2 && pair.every((n) => typeof n === 'number' && n > 0)) {
      out[key] = [pair[0]!, pair[1]!];
    }
  }
  return out;
}

export function mapGenDepositRarity(id: string): number | undefined {
  const rules = (raw as { deposit_rules?: Record<string, { rarity?: number }> }).deposit_rules;
  const r = rules?.[id]?.rarity;
  return typeof r === 'number' && r >= 0 ? r : undefined;
}

export function mapGenMetalDepositMinEra(): Record<string, number> {
  const m = (raw as { metal_deposit_min_era?: Record<string, number> }).metal_deposit_min_era;
  if (!m || typeof m !== 'object') return { ...FALLBACK_METAL_ERA };
  return { ...FALLBACK_METAL_ERA, ...m };
}

/** Pełna mapa rarity (fallback + JSON). */
export function mapGenAllDepositRarities(): Record<string, number> {
  const out = { ...FALLBACK_DEPOSIT_RARITY } as Record<string, number>;
  const rules = (raw as { deposit_rules?: Record<string, { rarity?: number }> }).deposit_rules;
  if (rules) {
    for (const [id, row] of Object.entries(rules)) {
      if (typeof row?.rarity === 'number' && row.rarity >= 0) out[id] = row.rarity;
    }
  }
  return out;
}
