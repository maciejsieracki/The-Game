/**
 * terrain-improvements.ts
 * Bonusy ulepszeń terenu → plony heksa (B1-Q11=A, 15 typów z terrain-improvements.json).
 * PURE — lane EKONOMIA.
 */
import improvementsJson from '../../data/terrain-improvements.json';
import { Nakladka, TerenBazowy } from '../types/hex';
import type { TileYield } from './economy';

export type ImprovementBonusKey =
  | 'zywnosc' | 'praca' | 'handel' | 'pieniadz' | 'drewno' | 'kamien' | 'glina';

export type ImprovementBonus = Partial<Record<ImprovementBonusKey, number>>;

type ImprovementRow = {
  bonus?: ImprovementBonus;
  nazwa?: string;
  surowiec_ilosc_tura?: number;
  surowiecOdblokowany?: string | null;
  /** Ograniczenie do wybranych cywilizacji (typCywilizacji z civs.json) — pole ogólny,
   *  patrz `isImprovementAllowedForCiv` niżej. Brak / pusta lista = wszystkie cywilizacje. */
  cywilizacje?: readonly string[];
};

const IMPROVEMENTS = improvementsJson as Record<string, ImprovementRow>;

/** Legacy klucze przed kanonem żywność+hodowla (save / stary enum). */
const LEGACY_KEY_ALIASES: Readonly<Record<string, string>> = {
  pastwisko: 'bydlo',
};

/**
 * R-KOPALNIA-UNIWERSALNA-Q1=B: migruj starą uniwersalną `kopalnia` → dedykowane typy.
 * Zwraca `null` gdy migracja niemożliwa (np. węgiel — brak dedykowanego ulepszenia).
 */
export function migrateLegacyKopalniaKey(
  key: string,
  hex?: { zloze?: string; nakladka?: Nakladka },
): string | null {
  if (key !== 'kopalnia') return key;
  const z = hex?.zloze?.trim().toLowerCase();
  if (z === 'zelazo') return 'kopalnia_zelaza';
  if (z === 'miedz' || z === 'ruda' || hex?.nakladka === Nakladka.ZlozeRudy) return 'kopalnia_miedzi';
  if (z === 'wegiel') return null;
  return 'kopalnia_miedzi';
}

/** Migruj listę warstw ulepszeń na heksie (save load). */
export function migrateImprovementLayers(
  layers: readonly string[],
  hex?: { zloze?: string; nakladka?: Nakladka },
): string[] {
  const out: string[] = [];
  for (const raw of layers) {
    const migrated = migrateLegacyKopalniaKey(raw, hex);
    if (migrated) out.push(migrated);
  }
  return out;
}

/** Klucze z JSON (bez _meta). */
export const IMPROVEMENT_KEYS: readonly string[] = Object.keys(IMPROVEMENTS)
  .filter(k => !k.startsWith('_'));

export function normalizeImprovementKey(raw: string | undefined | null): string | undefined {
  if (!raw || raw === 'brak') return undefined;
  const key = LEGACY_KEY_ALIASES[raw] ?? raw;
  return IMPROVEMENTS[key]?.bonus !== undefined || IMPROVEMENTS[key]
    ? key
    : (IMPROVEMENTS[raw] ? raw : undefined);
}

export function improvementBonusForKey(key: string): ImprovementBonus {
  const row = IMPROVEMENTS[key];
  if (!row?.bonus) return {};
  return { ...row.bonus };
}

/**
 * Dodaje bonus ulepszenia do plonów heksa.
 * pieniadz z JSON → handel (TileYield nie ma osobnego pieniadz na polu).
 */
export function applyImprovementBonus(yld: TileYield, improvementKey: string | undefined): void {
  if (!improvementKey) return;
  const b = improvementBonusForKey(improvementKey);
  if (b.zywnosc) yld.zywnosc += b.zywnosc;
  if (b.praca)   yld.praca   += b.praca;
  if (b.handel)  yld.handel  += b.handel;
  if (b.pieniadz) yld.handel += b.pieniadz;
  if (b.drewno)  yld.drewno  += b.drewno;
  if (b.kamien)  yld.kamien  += b.kamien;
  if (b.glina)   yld.glina   += b.glina;
}

/** Ilość rudy wydobywanej z kopalni na turę (analogicznie do glina=2 z glinianki). */
export const ORE_YIELD_PER_MINE = 2;

/**
 * Plon rudy miedzi vs żelaza z ulepszeń kopalni (kopalnia_miedzi → ruda; kopalnia_zelaza → ruda_zelaza).
 */
export function oreYieldFromImprovements(
  improvementKeys: readonly string[],
  zloze?: string | null,
): { ruda: number; ruda_zelaza: number } {
  let ruda = 0;
  let ruda_zelaza = 0;
  for (const raw of improvementKeys) {
    const key = normalizeImprovementKey(raw);
    if (key === 'kopalnia_miedzi') {
      ruda += ORE_YIELD_PER_MINE;
    } else if (key === 'kopalnia_zelaza') {
      ruda_zelaza += ORE_YIELD_PER_MINE;
    }
  }
  return { ruda, ruda_zelaza };
}

/** Suma bonusów wielu warstw ulepszeń na jednym heksie (kanon §3). */
export function applyImprovementBonuses(yld: TileYield, improvementKeys: readonly string[]): void {
  for (const key of improvementKeys) {
    applyImprovementBonus(yld, key);
  }
}

// ---------------------------------------------------------------------------
// SUROW-TERYT-01 (Maciej 2026-07-23): produkcja surowcow logistycznych PER
// ZBUDOWANE ULEPSZENIE w terytorium wlasciciela, niezaleznie od tego czy heks
// jest obsadzony populacja (workedTiles) -- patrz turn-economy.ts
// computeTerritoryResourceYieldByCity. Dotyczy WYLACZNIE surowcow wydobywanych
// (drewno/kamien/glina/ruda/ruda_zelaza/sol/zloto/kon — PYTANIE-84-U20); Zywnosc i Praca
// workedTiles (BEZ ZMIAN).
//
// Stawki: pole "surowiec_ilosc_tura" w terrain-improvements.json per ulepszenie.
// Wartosci REALNE (terrain-improvements.json; korekta balansu Maciej 2026-08-12,
// R-ZUZYCIE-SUROWCOW-OBYWATELE-PROD-Q1, ZASTEPUJE korekte 2026-08-09 nizej):
//   Tartak->drewno 10 · Glinianka->glina 10 · Kamieniolom->kamien 10 ·
//   Kopalnia miedzi->ruda 4 · Kopalnia (zloze zelaza)->ruda_zelaza 4.
// EN: rates above are current as of 2026-08-12 (R-ZUZYCIE-SUROWCOW-OBYWATELE-PROD-Q1);
// see terrain-improvements.json surowiec_ilosc_tura per improvement for source of truth.
// Domyslny fallback (gdy pole nieobecne w JSON) = 2/ture -- czysto bezpieczenstwo,
// nie stawka docelowa; do dalszego strojenia w panelu Excel jesli potrzeba.
// ---------------------------------------------------------------------------

export type TerritoryResourceKey =
  | 'drewno' | 'kamien' | 'glina' | 'ruda' | 'ruda_zelaza'
  | 'sol' | 'zloto' | 'kon';

export interface TerritoryResourceYield {
  resourceKey: TerritoryResourceKey;
  amount: number;
}

/** Ulepszenia produkujące surowiec do magazynu państwa niezależnie od workerów (SUROW-TERYT-01). */
const TERRITORY_YIELD_IMPROVEMENTS: ReadonlySet<string> = new Set([
  'tartak', 'kamieniolom', 'glinianka', 'kopalnia_miedzi', 'kopalnia_zelaza',
  'warzelnia_soli', 'stadnina', 'kopalnia_zlota',
]);

/** Fallback bezpieczenstwa gdy JSON nie ma pola `surowiec_ilosc_tura` (wszystkie 5
 *  ulepszen produkcyjnych maja dzis jawna wartosc w JSON -- patrz komentarz wyzej). */
export const TERRITORY_YIELD_DEFAULT_AMOUNT = 2;

function territoryYieldAmountForKey(key: string): number {
  const row = IMPROVEMENTS[key];
  const v = row?.surowiec_ilosc_tura;
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : TERRITORY_YIELD_DEFAULT_AMOUNT;
}

/**
 * Surowiec + ilosc/ture produkowane przez `key` (ulepszenie terenu), niezaleznie od
 * obsadzenia pola populacja. Zwraca null gdy ulepszenie nie produkuje surowca
 * do magazynu państwa (np. Farma, Droga).
 * `zloze` — ignorowane (każda kopalnia ma własny typ surowca).
 */
export function territoryResourceYieldForImprovement(
  key: string,
  zloze?: string | null,
): TerritoryResourceYield | null {
  const norm = normalizeImprovementKey(key);
  if (!norm || !TERRITORY_YIELD_IMPROVEMENTS.has(norm)) return null;
  switch (norm) {
    case 'tartak':          return { resourceKey: 'drewno', amount: territoryYieldAmountForKey(norm) };
    case 'kamieniolom':     return { resourceKey: 'kamien', amount: territoryYieldAmountForKey(norm) };
    case 'glinianka':       return { resourceKey: 'glina',  amount: territoryYieldAmountForKey(norm) };
    case 'kopalnia_miedzi': return { resourceKey: 'ruda',   amount: territoryYieldAmountForKey(norm) };
    case 'kopalnia_zelaza': return { resourceKey: 'ruda_zelaza', amount: territoryYieldAmountForKey(norm) };
    case 'warzelnia_soli':  return { resourceKey: 'sol',    amount: territoryYieldAmountForKey(norm) };
    // R-ZUZYCIE-SUROWCOW-OBYWATELE-PROD-Q1 (Maciej 2026-08-12): stawka teraz czytana z JSON
    // (surowiec_ilosc_tura), tak jak pozostale ulepszenia produkcyjne — wczesniej byla
    // zahardkodowana na 1 i ignorowala korekty balansu w danych.
    // EN: rate now read from JSON (surowiec_ilosc_tura), like the other production
    // improvements — previously hardcoded to 1 and ignoring data balance corrections.
    case 'stadnina':        return { resourceKey: 'kon',    amount: territoryYieldAmountForKey(norm) }; // PYTANIE-84-B3
    // N1 (Maciej 2026-08-12, dispatch po ecbddda8): stawka teraz czytana z JSON
    // (surowiec_ilosc_tura), tak jak pozostale ulepszenia produkcyjne (w tym stadnina
    // naprawiona w ecbddda8) — wczesniej byla zahardkodowana na 1, tak samo jak stadnina
    // przed naprawa. Dzis wartosc w JSON = 1, wiec zachowanie w grze bez zmian (1→1).
    // EN: rate now read from JSON (surowiec_ilosc_tura), like the other production
    // improvements (including stadnina, fixed in ecbddda8) — previously hardcoded to 1,
    // same as stadnina before its fix. Today's JSON value is 1, so in-game behavior is
    // unchanged (1→1).
    case 'kopalnia_zlota':  return { resourceKey: 'zloto',  amount: territoryYieldAmountForKey(norm) }; // PYTANIE-84-B4
    default: return null;
  }
}

/** Złoże zwierzęce hodowlane na mapie = implicit warstwa ulepszenia (kanon Maciej 2026-06-26). */
export function foodLayerFromAnimalDeposit(nakladka?: Nakladka): string | null {
  if (nakladka === Nakladka.ZlozeBydla) return 'bydlo';
  if (nakladka === Nakladka.ZlozeOwiec) return 'owce';
  return null;
}

/**
 * Warstwy ulepszeń na heksie (jawnie postawione — ABC-18: złoże bez pastwiska nie daje plonów).
 */
export function improvementKeysForHex(
  hex: {
    ulepszenie?: unknown;
    ulepszenia?: readonly string[] | null;
    nakladka?: Nakladka;
  },
): string[] {
  if (hex.ulepszenia?.length) {
    const keys = hex.ulepszenia
      .map(k => normalizeImprovementKey(String(k)))
      .filter((k): k is string => !!k);
    return [...new Set(keys)];
  }
  const single = normalizeImprovementKey(String(hex.ulepszenie ?? 'brak'));
  return single ? [single] : [];
}

/** Droga nie przykrywa markera złoża/plonów w rogu heksa. */
export const ROAD_IMPROVEMENT_KEYS = new Set(['droga', 'droga_brukowana']);

/**
 * Heks z dowolnym ulepszeniem terenu (poza drogą) — używane np. do etykiet plonów w okolicy miasta.
 * NIE służy do ukrywania ikon złóż na mapie (patrz `hexSuppressesDepositOverlay`).
 */
export function hexHasCoveringTerrainImprovement(
  hex: Parameters<typeof improvementKeysForHex>[0],
): boolean {
  return improvementKeysForHex(hex).some(k => !ROAD_IMPROVEMENT_KEYS.has(k));
}

/** Czy postawione ulepszenie eksploatuje złoże/nakładkę na tym heksie (spójne z improvement-build). */
export function improvementHidesDepositOnHex(
  improvementKey: string,
  hex: { nakladka?: Nakladka; zloze?: string },
): boolean {
  const key = normalizeImprovementKey(improvementKey);
  if (!key) return false;
  const nakladka = hex.nakladka;
  const zloze = hex.zloze?.trim().toLowerCase();
  switch (key) {
    case 'glinianka':
      return nakladka === Nakladka.ZlozeGliny || zloze === 'glina';
    case 'kopalnia_miedzi':
      return zloze === 'miedz' || nakladka === Nakladka.ZlozeRudy || zloze === 'ruda';
    case 'kopalnia_zelaza':
      return zloze === 'zelazo';
    case 'kopalnia_zlota':
      return zloze === 'zloto';
    case 'warzelnia_soli':
      return zloze === 'sol';
    case 'stadnina':
      return nakladka === Nakladka.ZlozeKonia;
    case 'bydlo':
      return nakladka === Nakladka.ZlozeBydla;
    case 'owce':
      return nakladka === Nakladka.ZlozeOwiec;
    case 'lama':
      return nakladka === Nakladka.ZlozeLamy;
    default:
      return false;
  }
}

/**
 * Ukryj ikonę złoża w rogu heksa tylko gdy na heksie stoi ulepszenie DEDYKOWANE temu złożu
 * (Glinianka→glina, Kopalnia→ruda itd.). Farma / irygacja / droga / fort / tartak itp.
 * NIE chowają overlay (BUG-FARMA-GLINA-ZNIKA, Maciej 2026-07-29).
 */
export function hexSuppressesDepositOverlay(
  hex: Parameters<typeof improvementKeysForHex>[0] & { zloze?: string },
  extraLayers?: readonly string[],
): boolean {
  const keys = [...improvementKeysForHex(hex)];
  if (extraLayers?.length) {
    for (const raw of extraLayers) {
      const n = normalizeImprovementKey(String(raw));
      if (n && !keys.includes(n)) keys.push(n);
    }
  }
  if (keys.length === 0) return false;
  return keys.some(k => improvementHidesDepositOnHex(k, hex));
}

export function improvementDisplayName(key: string): string {
  return IMPROVEMENTS[key]?.nazwa ?? key;
}

/** Surowce zwierzęce — `_meta.klucze_surowcow_ASCII` w terrain-improvements.json. */
const LIVESTOCK_SUROWIEC_KEYS = new Set(['bydlo', 'owce', 'lama', 'kon']);

/**
 * Id ulepszeń hodowlanych z JSON (`surowiecOdblokowany` ∈ zwierzęta).
 * Kanon 2026-07-29: bydlo (Trzoda), owce, lama, stadnina — bez wymyślonych aliasów.
 */
export const LIVESTOCK_IMPROVEMENT_KEYS: readonly string[] = IMPROVEMENT_KEYS.filter(k => {
  const s = IMPROVEMENTS[k]?.surowiecOdblokowany;
  return typeof s === 'string' && LIVESTOCK_SUROWIEC_KEYS.has(s);
});

/** Czy klucz ulepszenia to hodowla zwierzęca z terrain-improvements.json. */
export function isLivestockImprovementKey(key: string): boolean {
  const norm = normalizeImprovementKey(key);
  if (!norm) return false;
  return LIVESTOCK_IMPROVEMENT_KEYS.includes(norm);
}

// ---------------------------------------------------------------------------
// C-TARASY-Q1 (Maciej 2026-07-26): mechanizm OGÓLNY ograniczania ulepszeń terenu
// do wybranych cywilizacji — pole `cywilizacje` (lista typCywilizacji z civs.json)
// w terrain-improvements.json. Konwencja identyczna z cudami świata (wonders.json
// WonderDef.cywilizacje + wonders-data.ts canCivBuildWonder: `.includes(typCywilizacji)`),
// NIE jest wyjątkiem tylko dla Tarasów — dowolne przyszłe ulepszenie civ-locked
// dodaje to samo pole w JSON, bez zmian w kodzie. Wywoływane symetrycznie dla
// gracza i AI przez wołających spoza gra/src/map/** (main.ts refreshBuildApi,
// game/ai.ts planCityImprovements) — ten moduł jest PURE i nie zależy od
// map/improvement-build.ts (zablokowanego równoległym zleceniem górzystości).
// ---------------------------------------------------------------------------

/** Lista cywilizacji (typCywilizacji), do których ograniczone jest ulepszenie — undefined = brak ograniczenia. */
export function improvementAllowedCivs(key: string): readonly string[] | undefined {
  return IMPROVEMENTS[key]?.cywilizacje;
}

/** Czy cywilizacja `typCywilizacji` (np. 'chinczycy', 'inkowie') może budować dane ulepszenie terenu. */
export function isImprovementAllowedForCiv(
  key: string,
  typCywilizacji: string | undefined | null,
): boolean {
  const allowed = improvementAllowedCivs(key);
  if (!allowed || allowed.length === 0) return true;
  const t = (typCywilizacji ?? '').trim().toLowerCase();
  if (!t) return false;
  return allowed.some(c => c.trim().toLowerCase() === t);
}

// ---------------------------------------------------------------------------
// ZADANIE 1 (Maciej 2026-07-23): upkeep Pracy civ-wide za ulepszenia surowcowe.
// Wariant B (decyzja właściciela) -- płacą TAKŻE ulepszenia czysto dostępowe
// (warzelnia_soli, stadnina), nie tylko te produkujące surowiec logistyczny
// (TERRITORY_YIELD_IMPROVEMENTS powyżej). Zwolnione: żywnościowe + infrastruktura.
// Patrz turn-economy.ts computePracaUpkeepByOwner / countResourceUpkeepImprovementsByOwner.
// ---------------------------------------------------------------------------

/** Bonus żywności z farmy (terrain-improvements.json → farma.bonus.zywnosc). */
export const FARMA_POTENTIAL_FOOD_BONUS = IMPROVEMENTS.farma?.bonus?.zywnosc ?? 3;

/** Kara potencjału żywności na lesie przy auto-okolicy fokus żywność (R-OKOLICA-ZYWNOSC-SCORE). */
export const FOREST_FOOD_POTENTIAL_PENALTY = -3;

const FOOD_IMPROVEMENT_KEYS = new Set([
  'farma', 'irygacja', 'tarasy', 'bydlo', 'owce', 'lama', 'oboz_lowiecki', 'lodzie_rybackie',
]);

/**
 * Potencjał przyszłej żywności heksu (ranking auto-okolicy, fokus żywność).
 * +farma.bonus na otwartej łące/równinie bez ulepszenia żywnościowego; 0 gdy już farma/irygacja;
 * kara na nakładce Las (las nie jest celem fokusu żywności).
 */
export function foodPotentialForHex(
  terenBazowy: TerenBazowy,
  nakladka: Nakladka,
  improvementKeys: readonly string[],
): number {
  const keys = improvementKeys
    .map(k => normalizeImprovementKey(k))
    .filter((k): k is string => !!k);
  if (keys.some(k => FOOD_IMPROVEMENT_KEYS.has(k))) return 0;
  if (nakladka === Nakladka.Las) return FOREST_FOOD_POTENTIAL_PENALTY;
  if (terenBazowy === TerenBazowy.Laka || terenBazowy === TerenBazowy.Rownina) {
    return FARMA_POTENTIAL_FOOD_BONUS;
  }
  return 0;
}

/** Ulepszenia płacące −1 Praca/turę (civ-wide) z econ-params.json `ulepszenie_surowcowe_upkeep_praca`. */
export const RESOURCE_UPKEEP_IMPROVEMENT_KEYS: ReadonlySet<string> = new Set([
  'tartak', 'kamieniolom', 'glinianka', 'kopalnia_miedzi', 'kopalnia_zelaza',
  'warzelnia_soli', 'stadnina',
  // PYTANIE-84-B4: Kopalnia złota produkuje zloto/t do magazynu państwa (TERRITORY_YIELD powyżej).
  'kopalnia_zlota',
]);
