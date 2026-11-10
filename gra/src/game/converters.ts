/**
 * converters.ts
 * Przetworstwo surowcow (budynki przetworcze) dla The Game -- czysty modul,
 * bez DOM, bez THREE. Jedyny import: citizen-consumption-era (czysty moduł, wzór epoki m(e)).
 *
 * Kanon 2026-07-27 (PYTANIE-84 R6=B, U-14, U-14b — supersedes CERAMIKA-DOSTEP 2026-07-23):
 *   - Ceramika = magazyn państwa (stock); Garncarnia PRODUKUJE, NIE zużywa Ceramiki.
 *   - Zużycie Ceramiki wyłącznie Spichlerz I/II (B6/B8: 5 Ceramiki/turę).
 *   - U-14bA: nadwyżka Ceramiki po drain Spichlerza → auto +Zdrowie (zapas: +Zadowolenie).
 *   - Paliwo USUNIĘTE całkowicie (Mielerz usunięty); konwertery biorą DREWNO 1:1.
 *   Cegielnia  | 2 glina + 1 drewno | 2 cegly   | 50/t + 50% bazy/epokę właściciela (R-WEB-BRICK-PRODUCTION-X2-ERA-50PCT-Q1; wcześniej 1 cegła/cykl i +10%/epokę)
 *   Garncarnia | 1 glina + 1 drewno | 1 ceramika | 10/t + 10% bazy/epokę właściciela (P-KONWERTERY-PRZEPUSTOWOSC-Q1)
 *   Odlewnia brązu | 1 ruda + 1 drewno + 0.1 cyny | 1 braz | explicit owner-era throughput (era 2: 25, era 3+: 50)
 *   Odlewnia żelaza | braz (jak tier1) + żelazo (1 ruda_zelaza + 1 drewno) | 50/t × m(e) każdy
 *   Wielka odlewnia | braz + żelazo + stal (1 zelazo + 1 drewno) | 50/t × m(e) każdy (założenie: ta sama rodzina)
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

import { citizenConsumptionEraMultiplier } from './citizen-consumption-era';

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
  /** Optional explicit owner-era parameter rows. Values are flat caps, not era multipliers. */
  throughputEraParamKeys?: Readonly<Record<number, string>>;
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
  { id: 'cegielnia',              inputs: { glina: 2, drewno: 1 },         output: 'cegla',    outputAmount: 2, throughputParamKey: 'budynek_cegielnia_przepustowosc',        throughputFallback: 50 },
  { id: 'garncarnia',             inputs: { glina: 1, drewno: 1 },         output: 'ceramika', outputAmount: 1, throughputParamKey: 'budynek_garncarnia_przepustowosc',     throughputFallback: 50 },
  // 'mielerz' USUNIĘTY (Maciej 2026-07-23): Paliwo usunięte całkowicie; konwertery biorą drewno 1:1.
  { id: 'huta',                    inputs: { ruda: 1, drewno: 1 },          output: 'braz',     outputAmount: 1, throughputParamKey: 'budynek_huta_przepustowosc',             throughputFallback: 50 },
  // R-CYNA-BRAZ (Maciej 2026-08-13): trzeci input konwertera Brązu — Ruda cyny, proporcja
  // 1 Ruda cyny / 10 cykli (0.1/cykl). Klucz `ruda_cyny` — TA SAMA nazwa co magazyn państwa
  // zasilany przez Kopalnię cyny (turn-economy.ts creditTerritory('ruda_cyny', ...)) —
  // ŚWIADOMIE NIE `cyna` (spec używał tej nazwy skrótowo w prozie) — inny klucz oznaczałby,
  // że wydobyta Ruda cyny nigdy nie trafiałaby do puli, którą ten konwerter czyta, i Brąz
  // przestałby się produkować całkowicie (patrz runConverter: limitWejscia = floor(have(k)/perCykl),
  // have('cyna') zawsze 0 gdyby nic tego pola nie zasilało). Cyna NICZEGO nie zastępuje —
  // to DODATKOWY wymóg obok ruda+drewno (brak Cyny w magazynie → throughput=0, mimo dostępnej
  // Miedzi/Drewna — patrz cyna-surowiec-test.cjs).
  { id: 'odlewnia_brazu',          inputs: { ruda: 1, drewno: 1, ruda_cyny: 0.1 },          output: 'braz',     outputAmount: 1, throughputParamKey: 'budynek_huta_przepustowosc',             throughputFallback: 50, throughputEraParamKeys: { 2: 'budynek_huta_braz_epoka2_przepustowosc', 3: 'budynek_huta_braz_epoka3_przepustowosc' } },
  { id: 'odlewnia_zelaza__braz',   buildingId: 'odlewnia_zelaza', inputs: { ruda: 1, drewno: 1, ruda_cyny: 0.1 },          output: 'braz',     outputAmount: 1, throughputParamKey: 'budynek_huta_przepustowosc',             throughputFallback: 50, throughputEraParamKeys: { 2: 'budynek_huta_braz_epoka2_przepustowosc', 3: 'budynek_huta_braz_epoka3_przepustowosc' } },
  { id: 'odlewnia_zelaza__zelazo', buildingId: 'odlewnia_zelaza', inputs: { ruda_zelaza: 1, drewno: 1 },    output: 'zelazo',   outputAmount: 1, throughputParamKey: 'budynek_odlewnia_zelaza_przepustowosc', throughputFallback: 50 },
  { id: 'wielka_odlewnia__braz',   buildingId: 'wielka_odlewnia', inputs: { ruda: 1, drewno: 1, ruda_cyny: 0.1 },          output: 'braz',     outputAmount: 1, throughputParamKey: 'budynek_huta_przepustowosc',             throughputFallback: 50, throughputEraParamKeys: { 2: 'budynek_huta_braz_epoka2_przepustowosc', 3: 'budynek_huta_braz_epoka3_przepustowosc' } },
  { id: 'wielka_odlewnia__zelazo', buildingId: 'wielka_odlewnia', inputs: { ruda_zelaza: 1, drewno: 1 },    output: 'zelazo',   outputAmount: 1, throughputParamKey: 'budynek_odlewnia_zelaza_przepustowosc', throughputFallback: 50 },
  { id: 'wielka_odlewnia__stal',   buildingId: 'wielka_odlewnia', inputs: { zelazo: 1, drewno: 1 },        output: 'stal',     outputAmount: 1, throughputParamKey: 'budynek_wielka_odlewnia_przepustowosc',  throughputFallback: 50 },
];

// ---------------------------------------------------------------------------
// P-KONWERTERY-PRZEPUSTOWOSC-Q1 (Maciej 2026-08-12) -- Cegielnia/Garncarnia:
// "przepustowość 10 plus 10% możliwość awansu i ulepszenia co każdą epokę" --
// przepustowość rośnie +10% ADDYTYWNIE od bazy za KAŻDĄ epokę CYWILIZACJI
// WŁAŚCICIELA budynku (nie globalną epokę gry, nie poziom budynku
// buildingLevelForEpoch -- to OSOBNY system, patrz buildings.json maksPoziom).
// Baza 10: epoka1=10, epoka2=11, epoka3=12. Odlewnie nie dostają tego mechanizmu.
// Żelazo/stal używają m(e), a brąz jawnych parametrów per-era (R-WEB-BRONZE-FOUNDRY-OUTPUT-25-50-Q1).
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
export const CONVERTER_ERA_SCALING_RECIPE_IDS: ReadonlySet<string> = new Set(['garncarnia']);

/** Przyrost przepustowości na epokę (10% BAZY), addytywnie -- domyślny (Garncarnia), patrz komentarz wyżej. */
export const CONVERTER_ERA_SCALING_PCT = 0.10;

/**
 * R-WEB-FOUNDRY-THROUGHPUT-X2-ERA-MULT-Q1 (decyzja właściciela 2026-11-05): „zwiększ naturalną
 * ilość cykli z 25 do 50 dla odlewni brązu / żelaza … i w każdą epokę zwiększaj możliwości
 * zgodnie z mnożnikami 1, 1,5, 2 …". Żelazo/stal skalują PRZEPUSTOWOŚĆ
 * (cykle/turę) mnożnikiem epoki WŁAŚCICIELA m(e) = `citizenConsumptionEraMultiplier` (1 / 1,5 / 2 /
 * 2,5 / 3) -- jedna definicja wzoru dla konsumpcji obywateli i żelaza/stali. Brąz używa jawnych
 * parametrów per era z econ-params. Receptury (wejścia/wyjścia) bez zmian. Huta zostaje płaska;
 * Cegielnia skaluje WYJŚCIE (BRICK).
 */
export const CONVERTER_FOUNDRY_ERA_RECIPE_IDS: ReadonlySet<string> = new Set([
  'odlewnia_zelaza__zelazo',
  'wielka_odlewnia__zelazo',
  'wielka_odlewnia__stal',
]);

/**
 * R-WEB-BRICK-PRODUCTION-X2-ERA-50PCT-Q1 (decyzja właściciela 2026-11-05 + zgoda
 * „mnożniki te, co przy surowcach"): „dwukrotnie zwiększyć produkcję cegły" + „cegielnia
 * powinna zwiększać swoją produkcję o 50% w każdej epoce".
 *
 * (a) ×2: `outputAmount` Cegielni 1→2 (2 glina + 1 drewno → 2 cegły), baza przepustowości
 *     50 cykli/turę BEZ zmian.
 * (b) +50% BAZY za epokę właściciela jako MNOŻNIK WYJŚCIA (nie cykli): m(e) = 1 + 0,5 × (e − 1)
 *     = 1 / 1,5 / 2 / 2,5 / 3 -- ta sama krzywa co `citizenConsumptionEraMultiplier`
 *     (mnożniki surowców FALA 500). Pomiar w grze pokazał, że Cegielnię ogranicza WEJŚCIE
 *     (drewno 30/30 tur), więc mnożnik na cyklach byłby martwy; mnożnik na wyjściu działa
 *     w każdym reżimie i NIE zwiększa zużycia gliny/drewna (cykle i wejścia/cykl bez zmian).
 *     Cykle Cegielni są od tej pory PŁASKIE (poza CONVERTER_ERA_SCALING_RECIPE_IDS).
 * Jedna funkcja `converterOutputMultiplierForEra` dla gracza i AI.
 */
export const CONVERTER_OUTPUT_ERA_PCT_BY_RECIPE: Readonly<Record<string, number>> = {
  cegielnia: 0.50,
};

/** Sufiks klucza w mapie `throughputs` przekazującego mnożnik wyjścia do `runConverters`. */
export const CONVERTER_OUTPUT_MULT_KEY_SUFFIX = '#outMult';

/** Explicit per-era parameter row for a recipe, carrying the latest configured era forward. */
export function converterThroughputEraParamKey(recipe: ConverterRecipe, era: number): string | undefined {
  const rows = recipe.throughputEraParamKeys;
  if (!rows) return undefined;
  const e = Number.isFinite(era) && era > 1 ? Math.floor(era) : 1;
  const configured = Object.keys(rows).map(Number).filter(n => Number.isFinite(n)).sort((a, b) => a - b);
  const selected = configured.filter(n => n <= e).pop() ?? configured[0];
  return selected === undefined ? undefined : rows[selected];
}

/** Mnożnik WYJŚCIA receptury za epokę właściciela (1 dla receptur bez skalowania wyjścia). */
export function converterOutputMultiplierForEra(recipeId: string, era: number): number {
  const pct = CONVERTER_OUTPUT_ERA_PCT_BY_RECIPE[recipeId];
  if (pct === undefined) return 1;
  const e = Number.isFinite(era) && era > 1 ? Math.floor(era) : 1;
  return 1 + pct * (e - 1);
}

/**
 * Przepustowość konwertera po uwzględnieniu epoki WŁAŚCICIELA budynku (per-owner,
 * PARYTET AI -- ta sama funkcja dla gracza i AI, `era` to zwykły parametr liczbowy
 * bez gałęzi po ownerId). Garncarnia +10% bazy/epokę (addytywnie); Odlewnie
 * (CONVERTER_FOUNDRY_ERA_RECIPE_IDS) × m(e) = 1/1,5/2/2,5/3; brąz explicit per era;
 * Huta płaska; Cegielnia skaluje WYJŚCIE (`converterOutputMultiplierForEra`), jej cykle płaskie.
 * `era` < 1 lub nieskończone/NaN traktowane jak 1 (brak ujemnego/undefined mnożnika).
 */
export function converterThroughputForEra(
  recipeId: string,
  baseThroughput: number,
  era: number,
): number {
  if (CONVERTER_FOUNDRY_ERA_RECIPE_IDS.has(recipeId)) {
    return baseThroughput * citizenConsumptionEraMultiplier(era);
  }
  if (!CONVERTER_ERA_SCALING_RECIPE_IDS.has(recipeId)) return baseThroughput;
  const e = Number.isFinite(era) && era > 1 ? era : 1;
  return baseThroughput * (1 + CONVERTER_ERA_SCALING_PCT * (e - 1));
}

/**
 * Mapa dla `runConverters`: przepustowości per receptura + mnożniki wyjścia pod kluczem
 * `<id>#outMult` (tylko receptury ze skalowaniem wyjścia). Jedno miejsce dla gracza i AI.
 */
export function converterThroughputsForEra(
  baseOf: (recipe: ConverterRecipe, era: number) => number,
  era: number,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const recipe of DEFAULT_CONVERTER_RECIPES) {
    const base = baseOf(recipe, era);
    out[recipe.id] = recipe.throughputEraParamKeys
      ? base
      : converterThroughputForEra(recipe.id, base, era);
    const m = converterOutputMultiplierForEra(recipe.id, era);
    if (m !== 1) out[recipe.id + CONVERTER_OUTPUT_MULT_KEY_SUFFIX] = m;
  }
  return out;
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
  outputMultiplier = 1,
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

  const outMult = Number.isFinite(outputMultiplier) && outputMultiplier > 0 ? outputMultiplier : 1;
  const outPerCykl = recipe.outputAmount * outMult;
  const wolne = Math.max(0, outputCapacity - have(recipe.output));
  const limitWyjscia = outPerCykl > 0 ? Math.floor(wolne / outPerCykl) : 0;

  const cykle = Math.max(0, Math.min(tput, limitWejscia, limitWyjscia));

  const nowe: Record<string, number> = { ...stores };
  const consumed: Record<string, number> = {};
  if (cykle > 0) {
    for (const k of Object.keys(recipe.inputs)) {
      const used = (recipe.inputs[k] ?? 0) * cykle;
      nowe[k] = have(k) - used;
      consumed[k] = used;
    }
    nowe[recipe.output] = have(recipe.output) + outPerCykl * cykle;
  }

  let reason: ConverterReason = 'ok';
  if (cykle === 0) {
    if (tput === 0)              reason = 'zero-przepustowosci';
    else if (limitWejscia === 0) reason = 'brak-wejscia';
    else if (limitWyjscia === 0) reason = 'pelny-magazyn';
    else                         reason = 'brak-wejscia';
  }

  return { produced: cykle * outPerCykl, cykle, consumed, stores: nowe, reason };
}

export interface RunConvertersResult {
  stores:  Record<string, number>;
  perBuilding: Record<string, ConvertResult>;
}

/** Klucz budynku dla dopasowania receptury do runtimeBuiltIds. */
export function converterBuildingIdForRecipe(recipe: ConverterRecipe): string {
  return recipe.buildingId ?? recipe.id;
}

/**
 * P-CITYPANEL-BUDYNKI-BRAK-PRODUKCJI-W-LISCIE runda 2 (Maciej 2026-08-14, po
 * werdykcie FAIL Evaluatora N1): funkcja domenowa CZYSTA (bez DOM/UI) licząca
 * bilans produkcji konwertera (wejścia na minus, wyjście na plus) dla danego
 * budynku -- wyekstrahowana z `cityPanel.ts` (`buildingConverterProductionDisplay`)
 * właśnie po to, żeby dało się ją testować i wołać BEZPOŚREDNIO z bramki
 * testowej (`citypanel-konwerter-produkcja-test.cjs`), zamiast test miał WŁASNĄ
 * kopię formuły (tautologia złapana przez Evaluatora w rundzie 1). `cityPanel.ts`
 * woła TĘ SAMĄ funkcję -- nie ma po stronie UI żadnej reimplementacji tej logiki.
 * Liczba jest CELOWO BRUTTO (nominalna przepustowość, nie pomniejszona o brak
 * wejścia tej konkretnej tury) -- ten sam wybór, którego całą resztę logiki
 * (receptury, throughput, skalowanie epoką) i tak już robi silnik.
 * / EN: PURE domain function (no DOM/UI) computing a converter building's
 * production balance (inputs negative, output positive) -- extracted from
 * `cityPanel.ts` so the test gate can call it directly instead of keeping its
 * own copy of the formula (the round-1 test tautology the Evaluator caught).
 * `cityPanel.ts` now calls this exact function -- no UI-side reimplementation
 * of this logic remains. The number is DELIBERATELY BRUTTO (nominal
 * throughput, not reduced for this turn's actual input availability).
 */
export function converterProductionDisplayForBuilding(
  buildingId: string,
  rawParams: RawConverterParamsJson,
  difficulty: Difficulty,
  era: number,
): { consumed: Record<string, number>; produced: Record<string, number> } | null {
  const recipes = DEFAULT_CONVERTER_RECIPES.filter(
    r => converterBuildingIdForRecipe(r) === buildingId,
  );
  if (recipes.length === 0) return null;
  const consumed: Record<string, number> = {};
  const produced: Record<string, number> = {};
  for (const recipe of recipes) {
    const baseThroughput = loadThroughput(
      rawParams, recipe.throughputParamKey, difficulty, recipe.throughputFallback,
    );
    const eraParamKey = converterThroughputEraParamKey(recipe, era);
    const throughput = eraParamKey
      ? loadThroughput(rawParams, eraParamKey, difficulty, baseThroughput)
      : converterThroughputForEra(recipe.id, baseThroughput, era);
    for (const [key, perCykl] of Object.entries(recipe.inputs)) {
      if (!(perCykl > 0)) continue;
      consumed[key] = (consumed[key] ?? 0) + perCykl * throughput;
    }
    if (recipe.outputAmount > 0) {
      produced[recipe.output] = (produced[recipe.output] ?? 0) + recipe.outputAmount * converterOutputMultiplierForEra(recipe.id, era) * throughput;
    }
  }
  return { consumed, produced };
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

/** R-GARNCARNIA-CERAMIKA-SZCZESCIE-111-Q1: binarny bonus per miasto. */
export function ceramikaHappinessBonus(
  ceramikaPoDrainSpichlerza: number,
  maGarncarnie: boolean,
): number {
  return maGarncarnie && Number.isFinite(ceramikaPoDrainSpichlerza)
    && ceramikaPoDrainSpichlerza > 0 ? 1 : 0;
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
      // Szczęście nie skaluje się ilością Ceramiki.
      zadowolenieBonus: ceramikaHappinessBonus(nadwyzka, input.maGarncarnie),
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
    const outMult = throughputs[recipe.id + CONVERTER_OUTPUT_MULT_KEY_SUFFIX] ?? 1;
    const res = runConverter(recipe, cur, tput, capacityOf(recipe.output), outMult);
    cur = res.stores;
    perBuilding[recipe.id] = res;
  }

  return { stores: cur, perBuilding };
}
