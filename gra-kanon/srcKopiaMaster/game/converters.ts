/**
 * converters.ts
 * Przetworstwo surowcow (budynki przetworcze) dla The Game -- czysty modul,
 * bez DOM, bez THREE, ZERO importow runtime.
 *
 * Zrodlo: Spec-ekonomia.md s.1.5 ("Materialy z pol / budynkow"):
 *   Budynki przetworcze przeliczaja surowce wejsciowe na wyjsciowe w proporcji
 *   1:1, do swojej przepustowosci/ture. Produkcja jest automatyczna; wstrzymuje
 *   sie przy braku surowca wejsciowego LUB pelnym magazynie wyjscia.
 *
 *   | Budynek    | Wejscie/ture     | Wyjscie/ture | Przepustowosc |
 *   | Tartak     | 1 drewno         | 1 deska      | 2/t  [PT]     |
 *   | Mielerz    | 1 drewno         | 1 paliwo     | 2/t  [PT]     |
 *   | Cegielnia  | 1 glina+1 paliwo | 1 cegla      | 2/t  [PT]     |
 *   | Huta       | 1 ruda +1 paliwo | 1 braz       | 1/t  [PT]     |
 *   | Garncarnia | 1 glina+1 paliwo | 1 ceramika   | 1/t  [PT]     |
 *
 * Parametry przepustowosci sa juz w gra/data/econ-params.json (grupa "budynki":
 * budynek_tartak_przepustowosc, _mielerz_, _cegielnia_, _huta_, _garncarnia_).
 *
 * Zalozenia projektowe:
 *   1. Modul jest RECEPTUROWY (data-driven): operuje na ogolnym magazynie
 *      Record<klucz_surowca, ilosc> i liscie receptur. Klucze surowcow podaje
 *      integrator (z resources.json). DEFAULT_CONVERTER_RECIPES uzywa krotkich
 *      kluczy ASCII (drewno/deski/paliwo/glina/cegla/ruda/braz/ceramika) --
 *      [HANDOFF] integrator mapuje je na realne klucze magazynu (resources.json
 *      ma diakrytyki: "Cegla"/"Braz" -- rekomendacja: kolumna ASCII `id`).
 *   2. Pojemnosc magazynu wyjscia podaje sie z upkeep.resourceStorageCapacityPerType
 *      (s.7.2). Nadwyzka ponad pojemnosc NIE jest produkowana (przepustowosc
 *      przyciета do wolnego miejsca) -- zgodnie z "wstrzymuje sie przy pelnym".
 *   3. Czysto/pure: funkcje nie mutuja wejscia, zwracaja NOWY magazyn.
 *   4. Brak czesciowej konwersji ulamkowej: dzialamy na pelnych jednostkach
 *      (floor) -- 1:1 i przepustowosc to liczby calkowite.
 */

// ---------------------------------------------------------------------------
// Poziom trudnosci + czytnik parametrow
// ---------------------------------------------------------------------------

export type Difficulty = 'easy' | 'normal' | 'hard';

type RawParamRow = Record<string, number | string | undefined>;

export interface RawConverterParamsJson {
  budynki?: Record<string, RawParamRow>;
}

/**
 * Odczytaj przepustowosc danego budynku z econ-params.json (grupa budynki).
 * Brak/zly wpis -> fallback.
 */
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

// ---------------------------------------------------------------------------
// Receptury
// ---------------------------------------------------------------------------

export interface ConverterRecipe {
  /** Identyfikator budynku przetworczego (ASCII). */
  id:                 string;
  /** Surowce wejsciowe i ich ilosci na 1 cykl (klucze = klucze magazynu). */
  inputs:             Record<string, number>;
  /** Klucz surowca wyjsciowego. */
  output:             string;
  /** Ilosc wyjscia na 1 cykl (1:1 -> 1). */
  outputAmount:       number;
  /** Klucz parametru przepustowosci w econ-params.json (budynki.*). */
  throughputParamKey: string;
  /** Domyslna przepustowosc, gdy parametr nieobecny. */
  throughputFallback: number;
}

/**
 * Domyslny zestaw receptur (Spec s.1.5). Klucze surowcow ASCII -- integrator
 * mapuje je na realne klucze magazynu z resources.json. [HANDOFF]
 */
export const DEFAULT_CONVERTER_RECIPES: ReadonlyArray<ConverterRecipe> = [
  { id: 'tartak',     inputs: { drewno: 1 },            output: 'deski',    outputAmount: 1, throughputParamKey: 'budynek_tartak_przepustowosc',     throughputFallback: 2 },
  { id: 'mielerz',    inputs: { drewno: 1 },            output: 'paliwo',   outputAmount: 1, throughputParamKey: 'budynek_mielerz_przepustowosc',    throughputFallback: 2 },
  { id: 'cegielnia',  inputs: { glina: 1, paliwo: 1 },  output: 'cegla',    outputAmount: 1, throughputParamKey: 'budynek_cegielnia_przepustowosc',  throughputFallback: 2 },
  { id: 'huta',       inputs: { ruda: 1, paliwo: 1 },   output: 'braz',     outputAmount: 1, throughputParamKey: 'budynek_huta_przepustowosc',       throughputFallback: 1 },
  { id: 'odlewnia_brazu', inputs: { ruda: 1, paliwo: 1 }, output: 'braz', outputAmount: 1, throughputParamKey: 'budynek_huta_przepustowosc', throughputFallback: 1 },
  { id: 'garncarnia', inputs: { glina: 1, paliwo: 1 },  output: 'ceramika', outputAmount: 1, throughputParamKey: 'budynek_garncarnia_przepustowosc', throughputFallback: 1 },
];

// ---------------------------------------------------------------------------
// Pojedynczy konwerter
// ---------------------------------------------------------------------------

export type ConverterReason = 'ok' | 'brak-wejscia' | 'pelny-magazyn' | 'zero-przepustowosci';

export interface ConvertResult {
  /** Ile sztuk wyjscia faktycznie wyprodukowano. */
  produced: number;
  /** Ile cykli wykonano (= produced / outputAmount). */
  cykle:    number;
  /** Surowce zuzyte (per klucz). */
  consumed: Record<string, number>;
  /** NOWY magazyn po konwersji (wejscie nietkniete). */
  stores:   Record<string, number>;
  /** Dlaczego zatrzymano (gdy produced < przepustowosc). */
  reason:   ConverterReason;
}

/**
 * Uruchom jeden budynek przetworczy na jeden ture (Spec s.1.5).
 * Liczba cykli = min(przepustowosc, limit_wejscia, wolne_miejsce_wyjscia).
 *
 * @param recipe         receptura
 * @param stores         magazyn surowcow (Record<klucz, ilosc>)
 * @param throughput     maks cykli/ture (z loadThroughput)
 * @param outputCapacity pojemnosc magazynu surowca wyjsciowego (s.7.2)
 */
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

  // limit z wejscia: ile pelnych cykli pokrywa kazdy surowiec wejsciowy
  let limitWejscia = Infinity;
  for (const k of Object.keys(recipe.inputs)) {
    const perCykl = recipe.inputs[k];
    if (perCykl === undefined || perCykl <= 0) continue;
    limitWejscia = Math.min(limitWejscia, Math.floor(have(k) / perCykl));
  }
  if (!Number.isFinite(limitWejscia)) limitWejscia = 0;

  // wolne miejsce w magazynie wyjscia
  const wolne = Math.max(0, outputCapacity - have(recipe.output));
  const limitWyjscia = recipe.outputAmount > 0 ? Math.floor(wolne / recipe.outputAmount) : 0;

  const cykle = Math.max(0, Math.min(tput, limitWejscia, limitWyjscia));

  // zbuduj nowy magazyn
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
    if (tput === 0)            reason = 'zero-przepustowosci';
    else if (limitWejscia === 0) reason = 'brak-wejscia';
    else if (limitWyjscia === 0) reason = 'pelny-magazyn';
    else                        reason = 'brak-wejscia';
  }

  return { produced: cykle * recipe.outputAmount, cykle, consumed, stores: nowe, reason };
}

// ---------------------------------------------------------------------------
// Lancuch konwerterow (kolejnosc ma znaczenie: paliwo z Mielerza zasila Hute)
// ---------------------------------------------------------------------------

export interface RunConvertersResult {
  stores:  Record<string, number>;          // magazyn po wszystkich konwerterach
  perBuilding: Record<string, ConvertResult>; // wynik per budynek (po id)
}

/**
 * Uruchom zestaw konwerterow po kolei na wspolnym magazynie (Spec s.1.5).
 * Kolejnosc receptur ma znaczenie: np. Mielerz (drewno->paliwo) powinien isc
 * przed Huta/Cegielnia/Garncarnia, ktore paliwa potrzebuja. DEFAULT_CONVERTER_RECIPES
 * jest juz w sensownej kolejnosci (tartak, mielerz, cegielnia, huta, garncarnia).
 *
 * @param recipes      konwertery do uruchomienia (tylko te z wybudowanym budynkiem)
 * @param stores       magazyn startowy
 * @param throughputs  przepustowosc per recipe.id (z loadThroughput); brak -> fallback
 * @param capacityOf   funkcja: klucz surowca -> pojemnosc jego magazynu (s.7.2)
 */
export function runConverters(
  recipes: ReadonlyArray<ConverterRecipe>,
  stores: Record<string, number>,
  throughputs: Record<string, number>,
  capacityOf: (resourceKey: string) => number,
): RunConvertersResult {
  let cur: Record<string, number> = { ...stores };
  const perBuilding: Record<string, ConvertResult> = {};

  for (const recipe of recipes) {
    const tput = Object.prototype.hasOwnProperty.call(throughputs, recipe.id)
      ? (throughputs[recipe.id] ?? recipe.throughputFallback)
      : recipe.throughputFallback;
    const res = runConverter(recipe, cur, tput, capacityOf(recipe.output));
    cur = res.stores;
    perBuilding[recipe.id] = res;
  }

  return { stores: cur, perBuilding };
}
