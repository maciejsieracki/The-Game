/**
 * society-breakdown.ts
 * Model procentowy Szczęścia + Prawa → Porządek (B2: 1C, 2A, 3, B2-Q12).
 * PURE — bez DOM, bez main.ts.
 */
import type { City, CityPodzialHandlu } from './cities';
import { DEFAULT_PODZIAL_HANDLU } from './cities';
import {
  type Difficulty,
  type OrderEffects,
  type OrderParams,
  type OrderTier,
  type SocietyParamsLike,
  FALLBACK_ORDER_PARAMS,
  loadOrderParams,
  orderEffects,
} from './order';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SocietyLine {
  id: string;
  label: string;
  value: number;
}

export interface HappinessPctBreakdown {
  lines: SocietyLine[];
  netto: number;
  szMax: number;
  szPct: number;
}

export interface LawPctBreakdown {
  lines: SocietyLine[];
  netto: number;
  prawMax: number;
  prawPct: number;
}

export type PorPctBand =
  | 'lad'
  | 'spokoj'
  | 'napiecie'
  | 'niepokoj'
  | 'bunt'
  | 'bunt_skrajny';

export interface OrderPctBreakdown {
  sz: HappinessPctBreakdown;
  prawo: LawPctBreakdown;
  wagaSz: number;
  wagaPraw: number;
  porPct: number;
  tier: OrderTier;
  band: PorPctBand;
  bandLabel: string;
  effects: OrderEffects;
}

export interface HappinessBreakdownInput {
  difficulty?: Difficulty;
  era?: number;
  population: number;
  /** Suma zadowolenia z budynków (pkt). */
  buildingZadowolenie: number;
  haKult?: number;
  haRel?: number;
  haWealth?: number;
  /** CUDA-EKON-01 (2026-07-23): suma bonusy.miasto.zadowolenie cudów ukończonych (× każde miasto ownera). */
  haCuda?: number;
  podzialHandlu?: CityPodzialHandlu;
  atWar?: boolean;
  hasSwiatynia?: boolean;
  hasAmfiteatr?: boolean;
  ownCultureShare?: number;
  ownReligionDominant?: boolean;
  foreignReligionDominant?: boolean;
  /** Kara za podwójnie obce miasto po podboju (kultura + religia). */
  conquestUnstablePenalty?: number;
  /** D18-4: pierwsze miasto gracza na easy (T1–T10). */
  stolicaEasyBonus?: boolean;
}

export interface LawBreakdownInput {
  difficulty?: Difficulty;
  era?: number;
  /** Populacja miasta (D16-A: bonus osady). */
  population?: number;
  /** Jednostki stacjonujące w mieście (garnizon). */
  garnizonCount: number;
  hasRatusz?: boolean;
  hasPretorium?: boolean;
  hasSad?: boolean;
  /**
   * Pałac — główne źródło Prawa cywilizacyjnego (≠ garnizon).
   * @deprecated Użyj `palacTier` (1/2/3). Zostaje dla wstecznej zgodności — jeśli
   * podano `hasPalac: true` bez `palacTier`, liczy się jak tier 1 (stara wartość).
   */
  hasPalac?: boolean;
  /**
   * Który tier Pałacu stoi w mieście (B-PALAC-TIER-PRAWO, decyzja Macieja 2026-07-25,
   * Pytanie 27=A: Prawo z Pałacu rośnie z tierem). `null`/`undefined` = brak Pałacu
   * (chyba że `hasPalac: true` — patrz wyżej). Gdy miasto miałoby kilka wpisów
   * pałacowych naraz, przekaż tu najwyższy tier — liczy się TYLKO jeden wpis Pałacu,
   * nigdy suma.
   */
  palacTier?: 1 | 2 | 3 | null;
  brakGarnizonuKara?: boolean;
  /** Kara Prawa: niestabilny podbój bez garnizonu. */
  conquestNoGarrisonPenalty?: number;
  /** D18-4: pierwsze miasto gracza na easy (T1–T10). */
  stolicaEasyBonus?: boolean;
}

export const REVOLT_CRITICAL_POR_PCT = 12;
export const REVOLT_GRACE_TURNS = 3;

/** Progi buntu skrajnego + grace (B2-D18, data-driven). */
export interface RevoltParams {
  criticalPorPct: number;
  graceTurns: number;
}

export const FALLBACK_REVOLT_PARAMS: RevoltParams = {
  criticalPorPct: REVOLT_CRITICAL_POR_PCT,
  graceTurns: REVOLT_GRACE_TURNS,
};
/** Id frakcji rebeliantów (SILNIK mapuje na ownerId). */
export const REBEL_FACTION_OWNER_ID = -99;

/** Skala % Sz — wyższa = łagodniejsze kary (PT 2026-07). */
export const SZMAX_DEFAULTS: Readonly<Record<number, number>> = { 1: 14, 2: 20, 3: 28 };
/** Skala % Prawo — 5× jednostka (20) = 100%; 1 jedn. ≠ pełne Prawo (PT 2026-07). */
export const PRAWMAX_DEFAULTS: Readonly<Record<number, number>> = { 1: 50, 2: 75, 3: 100 };
export const SZ_PCT_CAP = 120;
export const PRAW_PCT_CAP = 100;

// ---------------------------------------------------------------------------
// Society param helpers
// ---------------------------------------------------------------------------

interface RawParamRow {
  easy?: number | number[];
  normal?: number | number[];
  hard?: number | number[];
}

/** D-START-OSIEDLE: bonus malejący pop 1→4 (tablica per trudność w JSON). */
export function pickOsiedlePopBonus(
  block: Record<string, RawParamRow> | undefined,
  key: string,
  pop: number,
  difficulty: Difficulty,
  legacyFlatFallback = 0,
): number {
  const p = Math.floor(pop);
  if (p < 1 || p > 4) return 0;
  const idx = p - 1;
  const row = block?.[key];
  if (row) {
    const arr = row[difficulty];
    if (Array.isArray(arr) && typeof arr[idx] === 'number' && Number.isFinite(arr[idx])) {
      return arr[idx] as number;
    }
  }
  return legacyFlatFallback;
}

function pickSociety(
  block: Record<string, RawParamRow> | undefined,
  key: string,
  difficulty: Difficulty,
  fallback: number,
): number {
  const row = block?.[key];
  if (!row) return fallback;
  const v = row[difficulty];
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

export function osiedlePopLabel(pop: number): string {
  const p = Math.max(1, Math.floor(pop));
  return `Osiedle (${p} mieszk.)`;
}

/** Górny próg populacji bonusu osiedla (D-START-OSIEDLE, domyślnie 4). */
export function osiedlePopMax(
  society: SocietyParamsLike | null | undefined,
  difficulty: Difficulty = 'normal',
): number {
  const prBlock = (society?.prawo ?? {}) as Record<string, RawParamRow>;
  return Math.max(1, Math.floor(
    pickSociety(prBlock, 'prawo_bonus_osada_prog', difficulty, 4),
  ));
}

/**
 * D-START-OSIEDLE: małe miasto (pop 1–4) — bonus Sz/Praw/Zdrowie + brak migracji/rebelii.
 * Immunitet liczy się per miasto (nie tylko stolica).
 */
export function isOsiedleRevoltImmune(
  population: number,
  society: SocietyParamsLike | null | undefined = null,
  difficulty: Difficulty = 'normal',
): boolean {
  const p = Math.floor(population);
  if (p < 1) return false;
  return p <= osiedlePopMax(society, difficulty);
}

export function loadRevoltParams(
  society: SocietyParamsLike | null | undefined,
  difficulty: Difficulty = 'normal',
): RevoltParams {
  const block = (society?.porzadek ?? {}) as Record<string, RawParamRow>;
  return {
    criticalPorPct: pickSociety(block, 'porzadek_prog_bunt_skrajny_pct', difficulty, REVOLT_CRITICAL_POR_PCT),
    graceTurns: pickSociety(block, 'porzadek_grace_tur_bunt', difficulty, REVOLT_GRACE_TURNS),
  };
}

/**
 * Rozstrzyga tier Pałacu (1/2/3) z pól `palacTier` / `hasPalac` (wsteczna zgodność —
 * B-PALAC-TIER-PRAWO). 0 = brak Pałacu. `palacTier` ma pierwszeństwo; `hasPalac: true`
 * bez `palacTier` = tier 1 (stara wartość, żeby żaden istniejący wywołujący się nie wywrócił).
 */
function resolvePalacTier(input: Pick<LawBreakdownInput, 'palacTier' | 'hasPalac'>): 0 | 1 | 2 | 3 {
  const t = input.palacTier;
  if (t === 1 || t === 2 || t === 3) return t;
  if (input.hasPalac) return 1;
  return 0;
}

function clampPct(x: number, cap: number): number {
  if (!Number.isFinite(x)) return 0;
  return Math.min(cap, Math.max(0, Math.round(x * 10) / 10));
}

function pctFromNetto(netto: number, max: number, cap: number): number {
  const m = max > 0 ? max : 1;
  return clampPct(100 * netto / m, cap);
}

export function szMaxForEra(era: number): number {
  const e = Number.isFinite(era) ? Math.max(1, Math.floor(era)) : 1;
  return SZMAX_DEFAULTS[e] ?? SZMAX_DEFAULTS[3] ?? 24;
}

export function prawMaxForEra(era: number): number {
  const e = Number.isFinite(era) ? Math.max(1, Math.floor(era)) : 1;
  return PRAWMAX_DEFAULTS[e] ?? PRAWMAX_DEFAULTS[3] ?? 24;
}

/** Bonus Sz od udziału Luksus % (Maciej B2-narzedzia-stabilizacji). */
export function luksusHappinessBonus(
  procentLuksus: number,
  society: SocietyParamsLike | null | undefined,
  difficulty: Difficulty = 'normal',
): number {
  const sz = (society?.szczescie ?? {}) as Record<string, RawParamRow>;
  const luks = Number.isFinite(procentLuksus) ? procentLuksus : 0;
  const tiers: [number, string][] = [
    [70, 'szczescie_bonus_luksus_70'],
    [60, 'szczescie_bonus_luksus_60'],
    [50, 'szczescie_bonus_luksus_50'],
    [40, 'szczescie_bonus_luksus_40'],
    [30, 'szczescie_bonus_luksus_30'],
  ];
  const defaults: Record<string, number> = {
    szczescie_bonus_luksus_30: 1,
    szczescie_bonus_luksus_40: 2,
    szczescie_bonus_luksus_50: 3,
    szczescie_bonus_luksus_60: 4,
    szczescie_bonus_luksus_70: 5,
  };
  for (const [threshold, key] of tiers) {
    if (luks >= threshold) {
      return pickSociety(sz, key, difficulty, defaults[key] ?? 0);
    }
  }
  return 0;
}

function podzialLuksus(city?: CityPodzialHandlu): number {
  const p = city ?? DEFAULT_PODZIAL_HANDLU;
  return p.procentLuksus ?? DEFAULT_PODZIAL_HANDLU.procentLuksus;
}

// ---------------------------------------------------------------------------
// Happiness breakdown
// ---------------------------------------------------------------------------

export function computeHappinessBreakdown(
  input: HappinessBreakdownInput,
  society: SocietyParamsLike | null | undefined = null,
): HappinessPctBreakdown {
  const diff = input.difficulty ?? 'normal';
  const szBlock = (society?.szczescie ?? {}) as Record<string, RawParamRow>;
  const lines: SocietyLine[] = [];
  const pop = Math.max(0, Math.floor(input.population ?? 0));
  const era = input.era ?? 1;

  if (input.buildingZadowolenie !== 0) {
    lines.push({ id: 'budynki', label: 'Budynki (+1/budynek)', value: input.buildingZadowolenie });
  }
  if (input.haKult) {
    lines.push({ id: 'kultura', label: 'Kultura dominująca', value: input.haKult });
  }
  if (input.haRel) {
    lines.push({ id: 'religia', label: 'Religia', value: input.haRel });
  }
  if (input.haWealth) {
    lines.push({ id: 'wealth', label: 'Wealth (pula luksusu)', value: input.haWealth });
  }
  if (input.haCuda) {
    lines.push({ id: 'cuda', label: 'Cuda świata', value: input.haCuda });
  }
  if (input.hasSwiatynia) {
    const v = pickSociety(szBlock, 'szczescie_swiatynia', diff, 1);
    if (v) lines.push({ id: 'swiatynia', label: 'Świątynia', value: v });
  }
  if (input.hasAmfiteatr) {
    const v = pickSociety(szBlock, 'szczescie_amfiteatr', diff, 1);
    if (v) lines.push({ id: 'amfiteatr', label: 'Amfiteatr', value: v });
  }

  const progZagesz = pickSociety(szBlock, 'szczescie_prog_zagęszczenia', diff, 4);
  const legacyMale = pop <= progZagesz
    ? pickSociety(szBlock, 'szczescie_male_miasto_bonus', diff, 1)
    : 0;
  const osiedleV = pickOsiedlePopBonus(
    szBlock, 'szczescie_bonus_osiedle_pop', pop, diff, legacyMale,
  );
  if (osiedleV) {
    lines.push({ id: 'osiedle', label: osiedlePopLabel(pop), value: osiedleV });
  }
  if (pop > progZagesz) {
    const karaPer = pickSociety(szBlock, 'szczescie_kara_wielkosc_miasta', diff, -1);
    const excess = pop - progZagesz;
    const v = karaPer * excess;
    if (v) lines.push({ id: 'zageszczenie', label: `Zagęszczenie (${pop}−${progZagesz})`, value: v });
  }

  const luksPct = podzialLuksus(input.podzialHandlu);
  const luksBonus = luksusHappinessBonus(luksPct, society, diff);
  if (luksBonus > 0) {
    lines.push({ id: 'niskie_podatki', label: `Niskie podatki (Zamożność ${luksPct}%)`, value: luksBonus });
  }

  if (input.atWar) {
    const v = pickSociety(szBlock, 'szczescie_kara_wojna', diff, -3);
    if (v) lines.push({ id: 'wojna', label: 'Wojna', value: v });
  }
  if (input.ownCultureShare !== undefined && input.ownCultureShare < 0.5) {
    const v = pickSociety(szBlock, 'szczescie_kara_obca_kultura', diff, -1);
    if (v) lines.push({ id: 'obca_kultura', label: 'Obca kultura', value: v });
  }
  if (input.foreignReligionDominant) {
    const v = pickSociety(szBlock, 'szczescie_kara_obca_religia', diff, -2);
    if (v) lines.push({ id: 'obca_religia', label: 'Obca religia', value: v });
  }
  if (input.conquestUnstablePenalty) {
    lines.push({
      id: 'podboj_niestabilny',
      label: 'Podbój: obca kultura i religia',
      value: input.conquestUnstablePenalty,
    });
  }
  if (input.stolicaEasyBonus) {
    const v = pickSociety(szBlock, 'szczescie_bonus_stolica_easy', diff, 1);
    if (v) lines.push({ id: 'stolica_easy', label: 'Stolica imperium (easy)', value: v });
  }

  const baseLuks = DEFAULT_PODZIAL_HANDLU.procentLuksus;
  if (luksPct < baseLuks) {
    const levels = Math.floor((baseLuks - luksPct) / 10);
    if (levels > 0) {
      const per = pickSociety(szBlock, 'szczescie_kara_wysokie_podatki', diff, -1);
      const v = per * levels;
      if (v) lines.push({ id: 'wysokie_podatki', label: 'Wysokie podatki', value: v });
    }
  }

  const netto = lines.reduce((s, l) => s + l.value, 0);
  const szMax = szMaxForEra(era);
  const szPct = pctFromNetto(netto, szMax, SZ_PCT_CAP);

  return { lines, netto, szMax, szPct };
}

// ---------------------------------------------------------------------------
// Law breakdown
// ---------------------------------------------------------------------------

export function computeLawBreakdown(
  input: LawBreakdownInput,
  society: SocietyParamsLike | null | undefined = null,
): LawPctBreakdown {
  const diff = input.difficulty ?? 'normal';
  const prBlock = (society?.prawo ?? {}) as Record<string, RawParamRow>;
  const lines: SocietyLine[] = [];
  const era = input.era ?? 1;

  const perUnit = pickSociety(prBlock, 'prawo_garnizon_per_jednostka', diff, 20);
  const capUnits = pickSociety(prBlock, 'prawo_garnizon_cap_jednostek', diff, 5);
  const units = Math.max(0, Math.floor(input.garnizonCount ?? 0));
  const effective = Math.min(units, capUnits);
  if (effective > 0) {
    lines.push({
      id: 'garnizon',
      label: `Garnizon (${effective} jedn.)`,
      value: perUnit * effective,
    });
  }

  if (input.hasRatusz) {
    const v = pickSociety(prBlock, 'prawo_ratusz', diff, 3);
    if (v) lines.push({ id: 'ratusz', label: 'Ratusz', value: v });
  }
  if (input.hasPretorium) {
    const v = pickSociety(prBlock, 'prawo_pretorium', diff, 2);
    if (v) lines.push({ id: 'pretorium', label: 'Pretorium', value: v });
  }
  if (input.hasSad) {
    const v = pickSociety(prBlock, 'prawo_sad', diff, 2);
    if (v) lines.push({ id: 'sad', label: 'Sąd', value: v });
  }
  const palacTier = resolvePalacTier(input);
  if (palacTier === 1 || palacTier === 2 || palacTier === 3) {
    const palacByTier: Record<1 | 2 | 3, { key: string; fallback: number; label: string }> = {
      1: { key: 'prawo_palac', fallback: 35, label: 'Pałac' },
      2: { key: 'prawo_palac_ii', fallback: 45, label: 'Pałac II' },
      3: { key: 'prawo_palac_iii', fallback: 55, label: 'Pałac III' },
    };
    const { key, fallback, label } = palacByTier[palacTier];
    const v = pickSociety(prBlock, key, diff, fallback);
    if (v) lines.push({ id: 'palac', label, value: v });
  }

  if (input.brakGarnizonuKara) {
    const v = pickSociety(prBlock, 'prawo_kara_brak_garnizonu', diff, -2);
    if (v) lines.push({ id: 'brak_garnizonu', label: 'Brak garnizonu (duże miasto)', value: v });
  }
  if (input.conquestNoGarrisonPenalty) {
    lines.push({
      id: 'podboj_bez_garnizonu',
      label: 'Podbój bez garnizonu',
      value: input.conquestNoGarrisonPenalty,
    });
  }

  const pop = Math.max(0, Math.floor(input.population ?? 0));
  const osadaProg = pickSociety(prBlock, 'prawo_bonus_osada_prog', diff, 4);
  const legacyOsada = pop > 0 && pop <= osadaProg
    ? pickSociety(prBlock, 'prawo_bonus_osada', diff, 3)
    : 0;
  const osiedleV = pickOsiedlePopBonus(
    prBlock, 'prawo_bonus_osiedle_pop', pop, diff, legacyOsada,
  );
  if (osiedleV) {
    lines.push({ id: 'osiedle', label: osiedlePopLabel(pop), value: osiedleV });
  }
  if (input.stolicaEasyBonus) {
    const v = pickSociety(prBlock, 'prawo_bonus_stolica_easy', diff, 1);
    if (v) lines.push({ id: 'stolica_easy', label: 'Stolica imperium (easy)', value: v });
  }

  const netto = lines.reduce((s, l) => s + l.value, 0);
  const prawMax = prawMaxForEra(era);
  const prawPct = pctFromNetto(Math.max(0, netto), prawMax, PRAW_PCT_CAP);

  return { lines, netto, prawMax, prawPct };
}

// ---------------------------------------------------------------------------
// PorPct tier + effects
// ---------------------------------------------------------------------------

export function porPctBand(porPct: number, criticalPorPct = REVOLT_CRITICAL_POR_PCT): PorPctBand {
  const p = Number.isFinite(porPct) ? porPct : 0;
  const crit = Number.isFinite(criticalPorPct) ? criticalPorPct : REVOLT_CRITICAL_POR_PCT;
  if (p >= 90) return 'lad';
  if (p >= 70) return 'spokoj';
  if (p >= 50) return 'napiecie';
  if (p >= 30) return 'niepokoj';
  if (p >= crit) return 'bunt';
  return 'bunt_skrajny';
}

export const POR_BAND_LABELS: Readonly<Record<PorPctBand, string>> = {
  lad: 'Ład',
  spokoj: 'Spokój',
  napiecie: 'Napięcie',
  niepokoj: 'Niepokój',
  bunt: 'Bunt',
  bunt_skrajny: 'Bunt skrajny',
};

export function tierFromPorPct(porPct: number): OrderTier {
  const p = Number.isFinite(porPct) ? porPct : 0;
  if (p >= 90) return 'order';
  if (p >= 30) return 'neutral';
  return 'unrest';
}

export function orderEffectsFromPorPct(
  porPct: number,
  params: OrderParams = FALLBACK_ORDER_PARAMS,
  criticalPorPct = REVOLT_CRITICAL_POR_PCT,
): OrderEffects {
  const band = porPctBand(porPct, criticalPorPct);
  switch (band) {
    case 'lad':
      return orderEffects('order', params);
    case 'spokoj':
      return orderEffects('neutral', params);
    case 'napiecie':
      return {
        productionMult: 0.95,
        pieniadzMult: 1,
        naukaMult: 1,
        kulturaMult: 1,
        growthMult: 1,
        tradeMult: 1,
        revoltRisk: 0,
      };
    case 'niepokoj':
      return orderEffects('unrest', params);
    case 'bunt':
      return {
        ...orderEffects('unrest', params),
        revoltRisk: params.ryzykoBuntuT1,
      };
    case 'bunt_skrajny':
    default: {
      const base = orderEffects('unrest', params);
      return {
        productionMult: Math.max(0, base.productionMult - 0.15),
        pieniadzMult: Math.max(0, base.pieniadzMult - 0.15),
        naukaMult: Math.max(0, base.naukaMult - 0.15),
        kulturaMult: Math.max(0, base.kulturaMult - 0.15),
        growthMult: base.growthMult,
        tradeMult: 1,
        revoltRisk: Math.min(1, params.ryzykoBuntuT1 + 0.03),
      };
    }
  }
}

export function computePorPct(
  szPct: number,
  prawPct: number,
  params: OrderParams = FALLBACK_ORDER_PARAMS,
): number {
  const wS = params.wagaSzczescie;
  const wP = params.wagaPrawo;
  return clampPct(wS * szPct + wP * prawPct, SZ_PCT_CAP);
}

export function computeOrderPctBreakdown(
  sz: HappinessPctBreakdown,
  prawo: LawPctBreakdown,
  params: OrderParams = FALLBACK_ORDER_PARAMS,
  revolt: RevoltParams = FALLBACK_REVOLT_PARAMS,
): OrderPctBreakdown {
  const porPct = computePorPct(sz.szPct, prawo.prawPct, params);
  const band = porPctBand(porPct, revolt.criticalPorPct);
  const tier = tierFromPorPct(porPct);
  const effects = orderEffectsFromPorPct(porPct, params, revolt.criticalPorPct);
  return {
    sz,
    prawo,
    wagaSz: params.wagaSzczescie,
    wagaPraw: params.wagaPrawo,
    porPct,
    tier,
    band,
    bandLabel: POR_BAND_LABELS[band],
    effects,
  };
}

/** Jedno wejście dla SILNIK — zastępuje evaluateOrder({ szczescie, prawo: 0 }). */
export function evaluateOrderFromBreakdown(
  happinessInput: HappinessBreakdownInput,
  lawInput: LawBreakdownInput,
  society: SocietyParamsLike | null | undefined,
  difficulty: Difficulty = 'normal',
): OrderPctBreakdown {
  const params = loadOrderParams(society, difficulty);
  const revolt = loadRevoltParams(society, difficulty);
  const sz = computeHappinessBreakdown(happinessInput, society);
  const prawo = computeLawBreakdown(lawInput, society);
  return computeOrderPctBreakdown(sz, prawo, params, revolt);
}

// ---------------------------------------------------------------------------
// Revolt grace (B2-Q12=C)
// ---------------------------------------------------------------------------

export interface RevoltGraceState {
  revoltGraceRemaining: number | null;
  revoltWarning: boolean;
  shouldTriggerRebellion: boolean;
  graceTurnsLeft: number | null;
}

export function updateRevoltGrace(
  currentGrace: number | null | undefined,
  porPct: number,
  revolt: RevoltParams = FALLBACK_REVOLT_PARAMS,
): RevoltGraceState {
  const crit = revolt.criticalPorPct;
  const graceTurns = Math.max(0, Math.floor(revolt.graceTurns));
  if (porPct >= crit) {
    return {
      revoltGraceRemaining: null,
      revoltWarning: false,
      shouldTriggerRebellion: false,
      graceTurnsLeft: null,
    };
  }

  if (currentGrace === null || currentGrace === undefined) {
    return {
      revoltGraceRemaining: graceTurns,
      revoltWarning: true,
      shouldTriggerRebellion: false,
      graceTurnsLeft: graceTurns,
    };
  }

  if (currentGrace > 0) {
    const next = currentGrace - 1;
    return {
      revoltGraceRemaining: next,
      revoltWarning: true,
      shouldTriggerRebellion: false,
      graceTurnsLeft: next,
    };
  }

  // grace === 0 — grace wyczerpany, nadal krytycznie
  return {
    revoltGraceRemaining: 0,
    revoltWarning: true,
    shouldTriggerRebellion: true,
    graceTurnsLeft: 0,
  };
}

export function revoltWarningMessage(cityName: string, graceTurnsLeft: number | null): string {
  if (graceTurnsLeft === null || graceTurnsLeft <= 0) {
    return `KRYTYCZNE — ostatnia szansa w ${cityName}! Grozi rebelia. Obniż podatki (Luksus) lub stacjonuj wojsko.`;
  }
  if (graceTurnsLeft === 1) {
    return `KRYTYCZNE — grozi bunt w ${cityName}! Ostatnia tura — obniż podatki lub wprowadź wojsko.`;
  }
  return `KRYTYCZNE — grozi bunt w ${cityName}! Masz ${graceTurnsLeft} tury na reakcję (podatki/Wealth lub garnizon).`;
}

/** Koszyki emotikon z SzPct (1C — wizualizacja, nie źródło prawdy). */
export function happinessBucketsFromPct(
  population: number,
  szPct: number,
): { zadowoleni: number; kontentni: number; niezadowoleni: number } {
  const pop = Number.isFinite(population) && population > 0 ? Math.floor(population) : 0;
  if (pop <= 0) return { zadowoleni: 0, kontentni: 0, niezadowoleni: 0 };
  const p = Number.isFinite(szPct) ? szPct : 0;
  const happyFrac = Math.min(1, Math.max(0, (p - 50) / 50));
  const unhappyFrac = Math.min(1, Math.max(0, (50 - p) / 50));
  const zadowoleni = Math.floor(pop * happyFrac);
  const niezadowoleni = Math.floor(pop * unhappyFrac);
  const kontentni = pop - zadowoleni - niezadowoleni;
  return { zadowoleni, kontentni, niezadowoleni };
}
