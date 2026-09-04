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
  /** Dostęp do Ceramiki (pkt), osobno od bonusu budynków. */
  ceramikaZadowolenie?: number;
  /** Działający Spichlerz (pkt), niezależnie od Ceramiki. */
  spichlerzZadowolenie?: number;
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
  /**
   * R-ZUZYCIE-SUROWCOW-OBYWATELE (Maciej 2026-08-10): suma kar/bonusów Szczęścia za pokrycie
   * zużycia surowców budowlanych obywateli tego miasta (+1/surowiec dostępny w magazynie
   * centralnym imperium, -1/surowiec brakujący — binarne per surowiec, ECHO Q3=A). Wołający
   * dostarcza już zsumowaną wartość — `resolveCitizenResourceCoverage(era, empireStock)
   * .happinessDelta` (`citizen-resource-upkeep.ts`). AI i Państwa-Miasta objęte identycznie
   * jak gracz (ECHO Q2=A) — brak specjalnej ścieżki `ownerId===0`.
   */
  citizenResourceHappinessDelta?: number;
}

export interface LawBreakdownInput {
  difficulty?: Difficulty;
  era?: number;
  /** Populacja miasta (D16-A: bonus osady). */
  population?: number;
  /** Jednostki stacjonujące w mieście (garnizon). */
  garnizonCount: number;
  /** Dom Starszyzny — administracja lokalna miast regionalnych, poziom 1 (ADMIN-STOLICA). */
  hasDomStarszyzny?: boolean;
  /** Dwór Zarządcy — administracja lokalna miast regionalnych, poziom 2, zastępuje Dom Starszyzny. */
  hasDworZarzadcy?: boolean;
  hasPretorium?: boolean;
  hasSad?: boolean;
  /** Trybunał — dostępny wszędzie (stolica i region); dotąd nie był wpięty w system Prawa. */
  hasTrybunal?: boolean;
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

/**
 * Skala % Sz — wyższa = łagodniejsze kary (PT 2026-07).
 * R-SZCZESCIE-AUDYT-A-SKALA-NORMALIZACJA-Q1 (GOAL 1): wartość wiążąca żyje w
 * `gra/data/society-params.json` → `szczescie.szczescie_max_epoka`; ta stała jest
 * WYŁĄCZNIE fallbackiem przy braku wpisu w JSON (jak wszystkie sąsiednie parametry).
 */
const SZMAX_BY_ERA_DEFAULT: readonly [number, number, number] = [14, 20, 28];
export const SZMAX_DEFAULTS: Readonly<Record<number, number>> = {
  1: SZMAX_BY_ERA_DEFAULT[0],
  2: SZMAX_BY_ERA_DEFAULT[1],
  3: SZMAX_BY_ERA_DEFAULT[2],
};
/**
 * Skala % Prawo — 5× jednostka (20) = 100%; 1 jedn. ≠ pełne Prawo (PT 2026-07).
 * Fallback dla `prawo.prawo_max_epoka` w society-params.json (GOAL 1 jw.).
 */
const PRAWMAX_BY_ERA_DEFAULT: readonly [number, number, number] = [50, 75, 100];
export const PRAWMAX_DEFAULTS: Readonly<Record<number, number>> = {
  1: PRAWMAX_BY_ERA_DEFAULT[0],
  2: PRAWMAX_BY_ERA_DEFAULT[1],
  3: PRAWMAX_BY_ERA_DEFAULT[2],
};
/** Fallback dla `szczescie.szczescie_pct_cap`. */
export const SZ_PCT_CAP = 120;
/** Fallback dla `prawo.prawo_pct_cap`. */
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

/**
 * Odczyt wiersza-TABLICY (per trudność) z bloku society-params.json — ten sam wzorzec co
 * `pickOsiedlePopBonus`, ale zwraca całą tablicę, nie jeden indeks. Wiersz niepełny
 * (brak trudności, pusta tablica, wpis nieliczbowy) → kopia fallbacku.
 */
function pickSocietyArray(
  block: Record<string, RawParamRow> | undefined,
  key: string,
  difficulty: Difficulty,
  fallback: readonly number[],
): number[] {
  const arr = block?.[key]?.[difficulty];
  if (
    Array.isArray(arr) && arr.length > 0
    && arr.every((v) => typeof v === 'number' && Number.isFinite(v))
  ) {
    return arr.slice();
  }
  return fallback.slice();
}

/**
 * R-SZCZESCIE-AUDYT-A-SKALA-NORMALIZACJA-Q1: skala procentu Szczęścia i Prawa (mianownik
 * + cap), strojona z `society-params.json`, nie z kodu. Stałe `SZMAX_DEFAULTS` /
 * `PRAWMAX_DEFAULTS` / `SZ_PCT_CAP` / `PRAW_PCT_CAP` zostają wyłącznie jako fallback.
 */
export interface SocietyScaleParams {
  /** Mianownik % Szczęścia per epoka; indeks 0 = epoka 1, epoki dalsze biorą ostatni wpis. */
  szMaxByEra: number[];
  /** Mianownik % Prawa per epoka; indeks 0 = epoka 1. */
  prawMaxByEra: number[];
  /** Górne ograniczenie SzPct (%). */
  szPctCap: number;
  /** Górne ograniczenie PrawPct (%). */
  prawPctCap: number;
}

export const FALLBACK_SOCIETY_SCALE: Readonly<SocietyScaleParams> = Object.freeze({
  szMaxByEra: [...SZMAX_BY_ERA_DEFAULT],
  prawMaxByEra: [...PRAWMAX_BY_ERA_DEFAULT],
  szPctCap: SZ_PCT_CAP,
  prawPctCap: PRAW_PCT_CAP,
});

/**
 * Wczytaj skalę % Sz/Prawa z society-params.json (bloki `szczescie` i `prawo`).
 * Brak dowolnego klucza → wartość z `FALLBACK_SOCIETY_SCALE`, czyli ze stałej w TS.
 */
export function loadSocietyScaleParams(
  society: SocietyParamsLike | null | undefined,
  difficulty: Difficulty = 'normal',
): SocietyScaleParams {
  const szBlock = (society?.szczescie ?? {}) as Record<string, RawParamRow>;
  const prBlock = (society?.prawo ?? {}) as Record<string, RawParamRow>;
  const f = FALLBACK_SOCIETY_SCALE;
  return {
    szMaxByEra: pickSocietyArray(szBlock, 'szczescie_max_epoka', difficulty, f.szMaxByEra),
    prawMaxByEra: pickSocietyArray(prBlock, 'prawo_max_epoka', difficulty, f.prawMaxByEra),
    szPctCap: pickSociety(szBlock, 'szczescie_pct_cap', difficulty, f.szPctCap),
    prawPctCap: pickSociety(prBlock, 'prawo_pct_cap', difficulty, f.prawPctCap),
  };
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

/**
 * Wspólny odczyt tablicy „mianownik per epoka”: epoka 1 → indeks 0, epoka powyżej długości
 * tablicy → ostatni wpis (zachowanie identyczne ze starym `DEFAULTS[e] ?? DEFAULTS[3]`).
 */
function maxFromEraTable(era: number, table: readonly number[]): number {
  const e = Number.isFinite(era) ? Math.max(1, Math.floor(era)) : 1;
  if (table.length === 0) return 24;
  const v = table[Math.min(e, table.length) - 1];
  return typeof v === 'number' && Number.isFinite(v) ? v : 24;
}

export function szMaxForEra(
  era: number,
  scale: SocietyScaleParams = FALLBACK_SOCIETY_SCALE,
): number {
  return maxFromEraTable(era, scale.szMaxByEra);
}

export function prawMaxForEra(
  era: number,
  scale: SocietyScaleParams = FALLBACK_SOCIETY_SCALE,
): number {
  return maxFromEraTable(era, scale.prawMaxByEra);
}

/** Klucz JSON siatki Sz od udziału Zamożności (dziesięć przedziałów co 10 p.p.). */
const ZAMOZNOSC_SIATKA_KEY = 'szczescie_siatka_zamoznosc';

/**
 * Fallback siatki, gdy brak `szczescie_siatka_zamoznosc` w danych (nie powinno się zdarzyć
 * w grze — society-params.json zawsze ją niesie). Indeks 0 = 0–9% … indeks 9 = 90–100%.
 * Wartości identyczne z JSON (Maciej 2026-07-25, nowa siatka Sz od Zamożności).
 */
const ZAMOZNOSC_SIATKA_DEFAULT: Record<Difficulty, number[]> = {
  easy: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  normal: [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8],
  hard: [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7],
};

/**
 * Bonus/kara Sz od udziału Zamożności w podziale Daniny netto (Maciej 2026-07-25, nowa
 * siatka — decyzja właściciela). Co 10 p.p. udziału = 1 pkt Szczęścia; poniżej 10% udziału
 * to KARA (wartość ujemna) na normal/hard. Zero zahardkodowanych progów w kodzie poza
 * fallbackiem na wypadek braku danych — same wartości zawsze z `society.szczescie[ZAMOZNOSC_SIATKA_KEY]`.
 */
export function luksusHappinessBonus(
  procentLuksus: number,
  society: SocietyParamsLike | null | undefined,
  difficulty: Difficulty = 'normal',
): number {
  const sz = (society?.szczescie ?? {}) as Record<string, RawParamRow>;
  const luks = Number.isFinite(procentLuksus) ? procentLuksus : 0;
  const idx = Math.min(9, Math.max(0, Math.floor(luks / 10)));
  const row = sz[ZAMOZNOSC_SIATKA_KEY];
  const arr = row?.[difficulty];
  if (Array.isArray(arr) && typeof arr[idx] === 'number' && Number.isFinite(arr[idx])) {
    return arr[idx] as number;
  }
  return ZAMOZNOSC_SIATKA_DEFAULT[difficulty][idx] ?? 0;
}

function podzialLuksus(city?: CityPodzialHandlu): number {
  const p = city ?? DEFAULT_PODZIAL_HANDLU;
  return p.procentLuksus ?? DEFAULT_PODZIAL_HANDLU.procentLuksus;
}

/** Etykieta w rozpisce Szczęścia — „Kultura”, nie mylące „obca kultura” (to osobna mechanika podboju). */
function cultureHappinessLineLabel(haKult: number, ownCultureShare?: number): string {
  if (haKult < 0 && ownCultureShare !== undefined && ownCultureShare < 0.5) {
    const pct = Math.round(ownCultureShare * 100);
    return `Kultura (udział własnej ${pct}%)`;
  }
  return 'Kultura';
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
  const scale = loadSocietyScaleParams(society, diff);
  const lines: SocietyLine[] = [];
  const pop = Math.max(0, Math.floor(input.population ?? 0));
  const era = input.era ?? 1;

  if (input.buildingZadowolenie !== 0) {
    lines.push({ id: 'budynki', label: 'Budynki (+1/budynek)', value: input.buildingZadowolenie });
  }
  const ceramikaBonus = Number.isFinite(input.ceramikaZadowolenie)
    && (input.ceramikaZadowolenie ?? 0) > 0 ? 1 : 0;
  if (ceramikaBonus) {
    lines.push({ id: 'ceramika', label: 'Ceramika (dostęp)', value: ceramikaBonus });
  }
  const spichlerzBonus = Number.isFinite(input.spichlerzZadowolenie)
    && (input.spichlerzZadowolenie ?? 0) > 0 ? 1 : 0;
  if (spichlerzBonus) {
    lines.push({ id: 'spichlerz', label: 'Spichlerz (działający)', value: spichlerzBonus });
  }
  if (input.haKult) {
    lines.push({ id: 'kultura', label: cultureHappinessLineLabel(input.haKult, input.ownCultureShare), value: input.haKult });
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
  } else if (luksBonus < 0) {
    lines.push({ id: 'wysokie_podatki', label: `Wysokie podatki (Zamożność ${luksPct}%)`, value: luksBonus });
  }

  if (input.atWar) {
    const v = pickSociety(szBlock, 'szczescie_kara_wojna', diff, -3);
    if (v) lines.push({ id: 'wojna', label: 'Wojna', value: v });
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
  if (input.citizenResourceHappinessDelta) {
    lines.push({
      id: 'zaopatrzenie_obywateli',
      label: 'Zaopatrzenie obywateli (surowce)',
      value: input.citizenResourceHappinessDelta,
    });
  }

  // Stary mechanizm "wysokie podatki" (próg DEFAULT_PODZIAL_HANDLU.procentLuksus, kara co
  // 10 p.p. poniżej) USUNIĘTY 2026-07-25 — dublował się z karą już wbudowaną w nową siatkę
  // szczescie_siatka_zamoznosc powyżej (patrz raport zadania: przy udziale 5% na normalu
  // oba mechanizmy naraz dawały -2 pkt Sz, sama nowa siatka daje poprawne -1 pkt).

  const netto = lines.reduce((s, l) => s + l.value, 0);
  const szMax = szMaxForEra(era, scale);
  const szPct = pctFromNetto(netto, szMax, scale.szPctCap);

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
  const scale = loadSocietyScaleParams(society, diff);
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

  if (input.hasDomStarszyzny) {
    const v = pickSociety(prBlock, 'prawo_dom_starszyzny', diff, 28);
    if (v) lines.push({ id: 'dom_starszyzny', label: 'Dom Starszyzny', value: v });
  }
  if (input.hasDworZarzadcy) {
    const v = pickSociety(prBlock, 'prawo_dwor_zarzadcy', diff, 33);
    if (v) lines.push({ id: 'dwor_zarzadcy', label: 'Dwór Zarządcy', value: v });
  }
  if (input.hasPretorium) {
    const v = pickSociety(prBlock, 'prawo_pretorium', diff, 2);
    if (v) lines.push({ id: 'pretorium', label: 'Pretorium', value: v });
  }
  if (input.hasTrybunal) {
    const v = pickSociety(prBlock, 'prawo_trybunal', diff, 17);
    if (v) lines.push({ id: 'trybunal', label: 'Trybunał', value: v });
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
  const prawMax = prawMaxForEra(era, scale);
  const prawPct = pctFromNetto(Math.max(0, netto), prawMax, scale.prawPctCap);

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
  porPctCap: number = SZ_PCT_CAP,
): number {
  const wS = params.wagaSzczescie;
  const wP = params.wagaPrawo;
  const cap = Number.isFinite(porPctCap) ? porPctCap : SZ_PCT_CAP;
  return clampPct(wS * szPct + wP * prawPct, cap);
}

/** Rozbicie procentowego WKŁADU Szczęścia i Prawa do finalnego wyniku Porządku łącznie. */
export interface OrderContributionPct {
  /** % wkładu Szczęścia w wynik Porządku łącznie tej tury (0–100). */
  szWkladPct: number;
  /** % wkładu Prawa — zawsze `100 - szWkladPct` (oba razem = 100%). */
  prawWkladPct: number;
}

/**
 * P-PORZADEK-PANEL-CZYTELNOSC-ROZBICIE (Maciej 2026-08-12): Porządek łącznie to średnia ważona
 * `PorPct ≈ wagaSz×szPct + wagaPraw×prawPct` (`computePorPct`) — wkład KAŻDEGO paska to udział
 * jego WAŻONEJ wartości tej tury w sumie ważonej (nie sama waga `wagaSz`/`wagaPraw`, bo ta jest
 * stała niezależnie od tego, jak wysoki jest akurat SzPct/PrawPct — np. przy równych wagach
 * 50/50, ale SzPct=80 i PrawPct=20, Szczęście realnie „ciągnie” wynik mocniej niż Prawo, więc
 * jego wkład > 50%). Gdy oba ważone składniki wynoszą 0 (oba paski na zero — nie ma z czego
 * policzyć proporcji wartości), spada na podział wg samych wag jako sensowny fallback zamiast
 * dzielenia przez zero. Pure — bez DOM, zaokrąglenie do liczb całkowitych sumujących się do 100.
 */
export function orderContributionPct(
  szPct: number,
  prawPct: number,
  wagaSz: number,
  wagaPraw: number,
): OrderContributionPct {
  const wSzSafe = Number.isFinite(wagaSz) ? wagaSz : 0;
  const wPrawSafe = Number.isFinite(wagaPraw) ? wagaPraw : 0;
  const weightedSz = (Number.isFinite(szPct) ? szPct : 0) * wSzSafe;
  const weightedPraw = (Number.isFinite(prawPct) ? prawPct : 0) * wPrawSafe;
  const total = weightedSz + weightedPraw;
  if (total > 0) {
    const szWkladPct = Math.round((weightedSz / total) * 100);
    return { szWkladPct, prawWkladPct: 100 - szWkladPct };
  }
  const wSum = wSzSafe + wPrawSafe;
  const szWkladPct = wSum > 0 ? Math.round((wSzSafe / wSum) * 100) : 50;
  return { szWkladPct, prawWkladPct: 100 - szWkladPct };
}

export function computeOrderPctBreakdown(
  sz: HappinessPctBreakdown,
  prawo: LawPctBreakdown,
  params: OrderParams = FALLBACK_ORDER_PARAMS,
  revolt: RevoltParams = FALLBACK_REVOLT_PARAMS,
  scale: SocietyScaleParams = FALLBACK_SOCIETY_SCALE,
): OrderPctBreakdown {
  const porPct = computePorPct(sz.szPct, prawo.prawPct, params, scale.szPctCap);
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
  const scale = loadSocietyScaleParams(society, difficulty);
  const sz = computeHappinessBreakdown(happinessInput, society);
  const prawo = computeLawBreakdown(lawInput, society);
  return computeOrderPctBreakdown(sz, prawo, params, revolt, scale);
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
