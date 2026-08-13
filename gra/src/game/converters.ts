/**
 * converters.ts
 * Przetworstwo surowcow (budynki przetworcze) dla The Game -- czysty modul,
 * bez DOM, bez THREE, ZERO importow runtime.
 *
 * Kanon 2026-07-27 (PYTANIE-84 R6=B, U-14, U-14b — supersedes CERAMIKA-DOSTEP 2026-07-23):
 *   - Ceramika = magazyn państwa (stock); Garncarnia PRODUKUJE, NIE zużywa Ceramiki.
 *   - Zużycie Ceramiki wyłącznie Spichlerz I/II (B6/B8: 5 Ceramiki/turę).
 *   - U-14bA: nadwyżka Ceramiki po drain Spichlerza → auto +Zdrowie (zapas: +Zadowolenie).
 *   - Paliwo USUNIĘTE całkowicie (Mielerz usunięty); konwertery biorą DREWNO 1:1.
 *   Cegielnia  | 2 glina + 1 drewno | 1 cegla    | 10/t + 10% bazy/epokę właściciela (P-KONWERTERY-PRZEPUSTOWOSC-Q1)
 *   Garncarnia | 1 glina + 1 drewno | 1 ceramika | 10/t + 10% bazy/epokę właściciela (P-KONWERTERY-PRZEPUSTOWOSC-Q1)
 *   Odlewnia brązu | 1 ruda + 1 drewno | 1 braz  | 5/t (płaskie, bez skalowania epoką)
 *   Odlewnia żelaza | braz (jak tier1) + żelazo (1 ruda_zelaza + 1 drewno) | 5/t każdy (płaskie)
 *   Wielka odlewnia | braz + żelazo + stal (1 zelazo + 1 drewno) | 5/t każdy (płaskie)
 *   Stolarnia / Tartak — NIE konwertują (drewno TYP 1; deski wycofane).
 *
 * Lancuch odlewni (Maciej 2026-07-27): jeden slot, upgrade zastępuje poprzednik.
 * Wielka Kuźnia = tylko Pancerz (+15% lancuch), NIE produkuje stali.
 *
 * P-KONWERTERY-PRZEPUSTOWOSC-Q1 (Maciej 2026-08-12): przepustowości bazowe
 * podniesione (Cegielnia/Garncarnia 3|6 → 10, Odlewnie 1 → 5) + Cegielnia/Garncarnia
 * dostają +10% bazy ADDYTYWNIE za każdą epokę CYWILIZACJI WŁAŚCICIELA (nie epokę
 * gry, nie poziom budynku) -- patrz `converterThroughputForEra` niżej.
 */

export type Difficulty = 'easy' | 'normal' | 'hard';

type RawParamRow = Record<string, number | string | undefined>;

export interface RawConverterParamsJson {
  budynki?: Record<string, RawParamRow>;
}

export function loadThroughput(
  raw: RawConverterParamsJson,
  paramKey: string,
  difficulty: Difficulty,
  fallback: number,
): number {
  const bu  = raw.budynki ?? {};
  const row = bu[paramKey];
  const v   = row ? row[difficulty] : undefined;
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

export interface ConverterRecipe {
  /** Unikalny klucz receptury (moze roznic sie od buildingId przy wielu receptach/budynek). */
  id:                 string;
  /** Gdy ustawione — receptura dziala gdy ten budynek jest w runtimeBuiltIds (nie gdy id === budynek). */
  buildingId?:        string;
  inputs:             Record<string, number>;
  output:             string;
  outputAmount:       number;
  throughputParamKey: string;
  throughputFallback: number;
}

/**
 * Domyślny zestaw receptur (PYTANIE-84 2026-07-27: Ceramika stock + Garncarnia konwerter;
 * łańcuch odlewni multi-receptura; Wielka Kuźnia bez produkcji stali).
 */
// P-KONWERTERY-PRZEPUSTOWOSC-Q1 (Maciej 2026-08-12): nowe wartości bazowe --
// Cegielnia/Garncarnia przepustowość 10 (było 3/6), Odlewnie (wszystkie warianty
// łańcucha, share'ujące throughputParamKey) przepustowość 5 (było 1). / EN: new base
// throughput values -- Brickworks/Pottery 10 (was 3/6), all Foundry-chain variants
// (sharing a throughputParamKey) 5 (was 1).
// R-EKONOMIA-SUROWCE-SKALA-5X-Q1 (Maciej 2026-08-13): ×5 na WSZYSTKIE throughputFallback
// powyżej -- Cegielnia/Garncarnia 10→50, Odlewnie (wszystkie warianty) 5→25. Receptury
// (inputs/outputAmount, np. glina:2+drewno:1→cegla:1) ŚWIADOMIE NIE przeskalowane -- to
// są PROPORCJE konwersji, nie ilości produkcji; skalowanie throughput (cap cykli/turę)
// ×5 wystarcza do 5× wyższej produkcji cegły/ceramiki/brązu/żelaza/stali, bo cykle =
// min(throughput, limit wejścia, limit wyjścia) i limit wejścia rośnie automatycznie
// wraz z ×5'owaną produkcją glina/drewno/ruda z terytorium. Zmiana proporcji zamiast
// throughput złamałaby zasadę zadania „proporcje między produkcją/kosztem/utrzymaniem
// zostają identyczne względem siebie”. / EN: ×5 on ALL throughputFallback values above.
// Recipe ratios (inputs/outputAmount) deliberately UNCHANGED -- those are conversion
// PROPORTIONS, not production amounts; scaling only the throughput cap ×5 is sufficient
// to get 5× output, since cycles = min(throughput, input limit, output limit) and the
// input limit already scales automatically with the ×5'd territorial resource production.
export const DEFAULT_CONVERTER_RECIPES: ReadonlyArray<ConverterRecipe> = [
  { id: 'cegielnia',              inputs: { glina: 2, drewno: 1 },         output: 'cegla',    outputAmount: 1, throughputParamKey: 'budynek_cegielnia_przepustowosc',        throughputFallback: 50 },
  { id: 'garncarnia',             inputs: { glina: 1, drewno: 1 },         output: 'ceramika', outputAmount: 1, throughputParamKey: 'budynek_garncarnia_przepustowosc',     throughputFallback: 50 },
  // 'mielerz' USUNIĘTY (Maciej 2026-07-23): Paliwo usunięte całkowicie; konwertery biorą drewno 1:1.
  { id: 'huta',                    inputs: { ruda: 1, drewno: 1 },          output: 'braz',     outputAmount: 1, throughputParamKey: 'budynek_huta_przepustowosc',             throughputFallback: 25 },
  // R-CYNA-BRAZ (Maciej 2026-08-13): trzeci input konwertera Brązu — Ruda cyny, proporcja
  // 1 Ruda cyny / 10 cykli (0.1/cykl). Klucz `ruda_cyny` — TA SAMA nazwa co magazyn państwa
  // zasilany przez Kopalnię cyny (turn-economy.ts creditTerritory('ruda_cyny', ...)) —
  // ŚWIADOMIE NIE `cyna` (spec używał tej nazwy skrótowo w prozie) — inny klucz oznaczałby,
  // że wydobyta Ruda cyny nigdy nie trafiałaby do puli, którą ten konwerter czyta, i Brąz
  // przestałby się produkować całkowicie (patrz runConverter: limitWejscia = floor(have(k)/perCykl),
  // have('cyna') zawsze 0 gdyby nic tego pola nie zasilało). Cyna NICZEGO nie zastępuje —
  // to DODATKOWY wymóg obok ruda+drewno (brak Cyny w magazynie → throughput=0, mimo dostępnej
  // Miedzi/Drewna — patrz cyna-surowiec-test.cjs).
  { id: 'odlewnia_brazu',          inputs: { ruda: 1, drewno: 1, ruda_cyny: 0.1 },          output: 'braz',     outputAmount: 1, throughputParamKey: 'budynek_huta_przepustowosc',             throughputFallback: 25 },
  { id: 'odlewnia_zelaza__braz',   buildingId: 'odlewnia_zelaza', inputs: { ruda: 1, drewno: 1, ruda_cyny: 0.1 },          output: 'braz',     outputAmount: 1, throughputParamKey: 'budynek_huta_przepustowosc',             throughputFallback: 25 },
  { id: 'odlewnia_zelaza__zelazo', buildingId: 'odlewnia_zelaza', inputs: { ruda_zelaza: 1, drewno: 1 },    output: 'zelazo',   outputAmount: 1, throughputParamKey: 'budynek_odlewnia_zelaza_przepustowosc', throughputFallback: 25 },
  { id: 'wielka_odlewnia__braz',   buildingId: 'wielka_odlewnia', inputs: { ruda: 1, drewno: 1, ruda_cyny: 0.1 },          output: 'braz',     outputAmount: 1, throughputParamKey: 'budynek_huta_przepustowosc',             throughputFallback: 25 },
  { id: 'wielka_odlewnia__zelazo', buildingId: 'wielka_odlewnia', inputs: { ruda_zelaza: 1, drewno: 1 },    output: 'zelazo',   outputAmount: 1, throughputParamKey: 'budynek_odlewnia_zelaza_przepustowosc', throughputFallback: 25 },
  { id: 'wielka_odlewnia__stal',   buildingId: 'wielka_odlewnia', inputs: { zelazo: 1, drewno: 1 },        output: 'stal',     outputAmount: 1, throughputParamKey: 'budynek_wielka_odlewnia_przepustowosc',  throughputFallback: 25 },
];

// ---------------------------------------------------------------------------
// P-KONWERTERY-PRZEPUSTOWOSC-Q1 (Maciej 2026-08-12) -- Cegielnia/Garncarnia:
// "przepustowość 10 plus 10% możliwość awansu i ulepszenia co każdą epokę" --
// przepustowość rośnie +10% ADDYTYWNIE od bazy za KAŻDĄ epokę CYWILIZACJI
// WŁAŚCICIELA budynku (nie globalną epokę gry, nie poziom budynku
// buildingLevelForEpoch -- to OSOBNY system, patrz buildings.json maksPoziom).
// Baza 10: epoka1=10, epoka2=11, epoka3=12. Odlewnie (huta/odlewnia_brazu/
// odlewnia_zelaza*/wielka_odlewnia*) NIE dostają tego mechanizmu -- zostają płaskie.
// / EN: Brickworks/Pottery throughput grows +10% ADDITIVELY from the base for EVERY
// era of the OWNING civilization (not the global game era, not the building's own
// level system). Base 10: era1=10, era2=11, era3=12. Foundries are excluded and
// stay flat.
//
// Interpretacja "+10%" -- ADDYTYWNA od BAZY, nie mnożnikowa/compound:
//   throughput(era) = base + base * PCT * (era - 1)
// Odrzucona alternatywa (compound: base * (1+PCT)^(era-1)) dawałaby dla bazy 10:
// epoka1=10, epoka2=11, epoka3=12,1 -- niemal identyczne dziś (3 epoki), ale
// rozjeżdżające się wykładniczo przy każdej kolejnej epoce dodanej w przyszłości.
// Dosłowne słowa właściciela "10 plus 10% ... co każdą epokę" czytamy jako stały,
// liniowy przyrost OD TEJ SAMEJ BAZY 10, nie jako mnożnik nawarstwiający się na
// wartości z poprzedniej epoki. / EN: rejected alternative (compound growth) would
// read "+10% every era" as compounding on the PREVIOUS era's value; the additive/
// linear reading (fixed % of the original base, summed per era) was picked as the
// more direct match for "10 plus 10% ... every era".
// ---------------------------------------------------------------------------

/** Receptury objęte skalowaniem +10%/epokę (klucz `id` z DEFAULT_CONVERTER_RECIPES). */
export const CONVERTER_ERA_SCALING_RECIPE_IDS: ReadonlySet<string> = new Set(['cegielnia', 'garncarnia']);

/** Przyrost przepustowości na epokę (10% BAZY), addytywnie -- patrz komentarz wyżej. */
export const CONVERTER_ERA_SCALING_PCT = 0.10;

/**
 * Przepustowość konwertera po uwzględnieniu epoki WŁAŚCICIELA budynku (per-owner,
 * PARYTET AI -- ta sama funkcja dla gracza i AI, `era` to zwykły parametr liczbowy
 * bez gałęzi po ownerId). Cegielnia/Garncarnia rosną +10% bazy/epokę (addytywnie);
 * reszta receptur (Odlewnie) zwraca `baseThroughput` bez zmian niezależnie od `era`.
 * `era` < 1 lub nieskończone/NaN traktowane jak 1 (brak ujemnego/undefined mnożnika).
 */
export function converterThroughputForEra(
  recipeId: string,
  baseThroughput: number,
  era: number,
): number {
  if (!CONVERTER_ERA_SCALING_RECIPE_IDS.has(recipeId)) return baseThroughput;
  const e = Number.isFinite(era) && era > 1 ? era : 1;
  return baseThroughput * (1 + CONVERTER_ERA_SCALING_PCT * (e - 1));
}

export type ConverterReason = 'ok' | 'brak-wejscia' | 'pelny-magazyn' | 'zero-przepustowosci';

export interface ConvertResult {
  produced: number;
  cykle:    number;
  consumed: Record<string, number>;
  stores:   Record<string, number>;
  reason:   ConverterReason;
}

export function runConverter(
  recipe: ConverterRecipe,
  stores: Record<string, number>,
  throughput: number,
  outputCapacity: number,
): ConvertResult {
  const have = (k: string): number => {
    const v = stores[k];
    return typeof v === 'number' && Number.isFinite(v) ? v : 0;
  };

  const tput = Number.isFinite(throughput) && throughput > 0 ? Math.floor(throughput) : 0;

  let limitWejscia = Infinity;
  for (const k of Object.keys(recipe.inputs)) {
    const perCykl = recipe.inputs[k];
    if (perCykl === undefined || perCykl <= 0) continue;
    limitWejscia = Math.min(limitWejscia, Math.floor(have(k) / perCykl));
  }
  if (!Number.isFinite(limitWejscia)) limitWejscia = 0;

  const wolne = Math.max(0, outputCapacity - have(recipe.output));
  const limitWyjscia = recipe.outputAmount > 0 ? Math.floor(wolne / recipe.outputAmount) : 0;

  const cykle = Math.max(0, Math.min(tput, limitWejscia, limitWyjscia));

  const nowe: Record<string, number> = { ...stores };
  const consumed: Record<string, number> = {};
  if (cykle > 0) {
    for (const k of Object.keys(recipe.inputs)) {
      const used = (recipe.inputs[k] ?? 0) * cykle;
      nowe[k] = have(k) - used;
      consumed[k] = used;
    }
    nowe[recipe.output] = have(recipe.output) + recipe.outputAmount * cykle;
  }

  let reason: ConverterReason = 'ok';
  if (cykle === 0) {
    if (tput === 0)              reason = 'zero-przepustowosci';
    else if (limitWejscia === 0) reason = 'brak-wejscia';
    else if (limitWyjscia === 0) reason = 'pelny-magazyn';
    else                         reason = 'brak-wejscia';
  }

  return { produced: cykle * recipe.outputAmount, cykle, consumed, stores: nowe, reason };
}

export interface RunConvertersResult {
  stores:  Record<string, number>;
  perBuilding: Record<string, ConvertResult>;
}

/** Klucz budynku dla dopasowania receptury do runtimeBuiltIds. */
export function converterBuildingIdForRecipe(recipe: ConverterRecipe): string {
  return recipe.buildingId ?? recipe.id;
}

// ---------------------------------------------------------------------------
// U-14b — Garncarnia: auto-efekt z nadwyżki Ceramiki (po drain Spichlerza)
// ---------------------------------------------------------------------------

/** U-14bA domyślnie +Zdrowie; zapas na +Zadowolenie (przyszły suwak / parametr). */
export type GarncarniaSurplusEffect = 'zdrowie' | 'zadowolenie';

export interface GarncarniaSurplusBonusInput {
  /** Zapas Ceramiki w magazynie państwa PO odjęciu drain Spichlerza (B6/B8). */
  ceramikaPoDrainSpichlerza: number;
  /** Garncarnia aktywna w imperium (runtime built). */
  maGarncarnie: boolean;
  /**
   * U-14bA: domyślnie 'zdrowie'. Zapas: 'zadowolenie' — ten sam surplus, inny efekt.
   * Zużycie Ceramiki wyłącznie Spichlerz; Garncarnia NIE konsumuje Ceramiki (U-14).
   */
  efekt?: GarncarniaSurplusEffect;
  /** Pkt Zdrowia na sztukę nadwyżki (domyślnie 1 — society-params zdrowie_ceramika). */
  zdrowieNaSztuke?: number;
  /** Pkt Zadowolenia na sztukę nadwyżki (zapas na przyszłość; domyślnie 0). */
  zadowolenieNaSztuke?: number;
}

export interface GarncarniaSurplusBonusResult {
  zdrowieBonus: number;
  zadowolenieBonus: number;
  /** Ile sztuk nadwyżki uwzględniono w bonusie (auto — cała nadwyżka > 0). */
  nadwyzkaSztuk: number;
}

/**
 * U-14bA: automatyczny bonus z nadwyżki Ceramiki w magazynie państwa
 * (po drain Spichlerza). Garncarnia produkuje Ceramikę; zużywa ją tylko Spichlerz.
 */
export function computeGarncarniaSurplusBonus(input: GarncarniaSurplusBonusInput): GarncarniaSurplusBonusResult {
  const nadwyzka = input.maGarncarnie
    ? Math.max(0, Math.floor(input.ceramikaPoDrainSpichlerza))
    : 0;

  if (nadwyzka <= 0) {
    return { zdrowieBonus: 0, zadowolenieBonus: 0, nadwyzkaSztuk: 0 };
  }

  const efekt = input.efekt ?? 'zdrowie';
  const zdrowieNaSztuke = input.zdrowieNaSztuke ?? 1;
  const zadowolenieNaSztuke = input.zadowolenieNaSztuke ?? 0;

  if (efekt === 'zadowolenie') {
    return {
      zdrowieBonus: 0,
      zadowolenieBonus: nadwyzka * zadowolenieNaSztuke,
      nadwyzkaSztuk: nadwyzka,
    };
  }

  return {
    zdrowieBonus: nadwyzka * zdrowieNaSztuke,
    zadowolenieBonus: 0,
    nadwyzkaSztuk: nadwyzka,
  };
}

export function runConverters(
  recipes: ReadonlyArray<ConverterRecipe>,
  stores: Record<string, number>,
  throughputs: Record<string, number>,
  capacityOf: (resourceKey: string) => number,
): RunConvertersResult {
  let cur: Record<string, number> = { ...stores };
  const perBuilding: Record<string, ConvertResult> = {};

  for (const recipe of recipes) {
    const tputKey = recipe.id;
    const tput = Object.prototype.hasOwnProperty.call(throughputs, tputKey)
      ? (throughputs[tputKey] ?? recipe.throughputFallback)
      : recipe.throughputFallback;
    const res = runConverter(recipe, cur, tput, capacityOf(recipe.output));
    cur = res.stores;
    perBuilding[recipe.id] = res;
  }

  return { stores: cur, perBuilding };
}
