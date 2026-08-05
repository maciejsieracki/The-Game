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

/**
 * Sufit gęstości reliefu (Góry+Wzgórza) per komórka fair-play — Maciej 2026-07-29.
 * medium: 10% Góry + 15% Wzgórza w komórce 15×15; Mało/Dużo przeskalowane względem starego stosunku.
 */
const FALLBACK_RELIEF_OVERFLOW_CAP: Record<DensityTier, { mountain: number; highland: number }> = {
  low: { mountain: 0.09, highland: 0.132 },
  medium: { mountain: 0.10, highland: 0.15 },
  high: { mountain: 0.24, highland: 0.318 },
};

/** Parametry pasm górskich (seed-and-grow) — Zadanie HILLS Q1/Q2 (2026-07-20). */
export interface MountainRangeTierParams {
  /** Ile heksów lądu w masie przypada na jedno pasmo (mniej = więcej pasm). */
  hexyNaPasmo: number;
  /** Twardy sufit liczby pasm na jedną masę lądu. */
  maxPasmNaMase: number;
  /** Min/max długość (kroki spaceru) pojedynczego pasma. */
  dlugoscMin: number;
  dlugoscMax: number;
  /** Minimalny rozmiar masy lądu, żeby w ogóle próbować dorzucić pasmo. */
  minMasaHexow: number;
  /**
   * ZADANIE 3 (2026-07-20): szansa (0..1), że sąsiad rdzenia/wzgórz dostanie „obrzeże"
   * (foothills, Wzgórza) — niżej niż 1.0 daje WĘŻSZE, wydłużone pasma (mniej rozlewania
   * na boki) zamiast okrągłych „plam". `rand()` wywoływany deterministycznie dla KAŻDEGO
   * kwalifikującego się kandydata (kolejność jak reszta pętli), więc A=B zostaje.
   */
  obrzezeSzansa: number;
}

const FALLBACK_MOUNTAIN_RANGE: Record<DensityTier, MountainRangeTierParams> = {
  low:    { hexyNaPasmo: 320, maxPasmNaMase: 2, dlugoscMin: 9,  dlugoscMax: 15, minMasaHexow: 40, obrzezeSzansa: 0.30 },
  medium: { hexyNaPasmo: 240, maxPasmNaMase: 3, dlugoscMin: 11, dlugoscMax: 18, minMasaHexow: 30, obrzezeSzansa: 0.35 },
  high:   { hexyNaPasmo: 170, maxPasmNaMase: 5, dlugoscMin: 13, dlugoscMax: 22, minMasaHexow: 24, obrzezeSzansa: 0.40 },
};
const FALLBACK_AKTYWNE_TYPY: Record<MapSizeLabel, number> = {
  mala: 3, srednia: 5, duza: 7, ogromna: 9, super: 11,
};
const FALLBACK_RYWALE: Record<MapSizeLabel, number> = {
  mala: 2, srednia: 4, duza: 6, ogromna: 8, super: 10,
};
const FALLBACK_METAL_ERA: Record<string, number> = { miedz: 2, zelazo: 3, wegiel: 8 };
const FALLBACK_DEPOSIT_RARITY: Partial<Record<string, number>> = {
  miedz: 0.10, zelazo: 0.08, glina: 0.30, konie: 0.10, wegiel: 0,
  owce: 0.08, bydlo: 0.07, sol: 0.12,
  // Maciej 2026-07-25: złoto — surowiec dostępowy Mennicy, celowo RZADSZY niż miedź/żelazo
  // (patrz gen-helpers.ts DEPOSIT_RULES komentarz przy id='zloto').
  zloto: 0.03,
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

/**
 * Sufit gęstości reliefu per komórka fair-play (Panel-A JSON `gestosc.relief_overflow_cap_frac`,
 * fallback w kodzie) — Maciej 2026-07-26, C-MAPA-Q2=B. Patrz FALLBACK_RELIEF_OVERFLOW_CAP.
 */
export function mapGenReliefOverflowCapFrac(tier: DensityTier): { mountain: number; highland: number } {
  const fb = FALLBACK_RELIEF_OVERFLOW_CAP[tier];
  const src = (raw as {
    gestosc?: { relief_overflow_cap_frac?: Record<string, Partial<Record<'mountain' | 'highland', number>>> };
  }).gestosc?.relief_overflow_cap_frac;
  const row = src?.[tierKey(tier)];
  if (!row) return { ...fb };
  const mountain = typeof row.mountain === 'number' && row.mountain > 0 ? row.mountain : fb.mountain;
  const highland = typeof row.highland === 'number' && row.highland > 0 ? row.highland : fb.highland;
  return { mountain, highland };
}

/** Parametry pasm górskich (Panel-A JSON `gestosc.pasma_gorskie`, fallback w kodzie). */
export function mapGenMountainRangeParams(tier: DensityTier): MountainRangeTierParams {
  const fb = FALLBACK_MOUNTAIN_RANGE[tier];
  const src = (raw as {
    gestosc?: { pasma_gorskie?: Record<string, Partial<Record<
      'hexy_na_pasmo' | 'max_pasm_na_mase' | 'dlugosc_min' | 'dlugosc_max' | 'min_masa_hexow' | 'obrzeze_szansa',
      number
    >>> };
  }).gestosc?.pasma_gorskie;
  const row = src?.[tierKey(tier)];
  if (!row) return { ...fb };
  const dlugoscMin = typeof row.dlugosc_min === 'number' && row.dlugosc_min > 0 ? row.dlugosc_min : fb.dlugoscMin;
  return {
    hexyNaPasmo: typeof row.hexy_na_pasmo === 'number' && row.hexy_na_pasmo > 0 ? row.hexy_na_pasmo : fb.hexyNaPasmo,
    maxPasmNaMase: typeof row.max_pasm_na_mase === 'number' && row.max_pasm_na_mase >= 0
      ? row.max_pasm_na_mase : fb.maxPasmNaMase,
    dlugoscMin,
    dlugoscMax: typeof row.dlugosc_max === 'number' && row.dlugosc_max >= dlugoscMin
      ? row.dlugosc_max : Math.max(fb.dlugoscMax, dlugoscMin),
    minMasaHexow: typeof row.min_masa_hexow === 'number' && row.min_masa_hexow >= 0
      ? row.min_masa_hexow : fb.minMasaHexow,
    obrzezeSzansa: typeof row.obrzeze_szansa === 'number' && row.obrzeze_szansa >= 0 && row.obrzeze_szansa <= 1
      ? row.obrzeze_szansa : fb.obrzezeSzansa,
  };
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
