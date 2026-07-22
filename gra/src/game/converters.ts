/**
 * converters.ts
 * Przetworstwo surowcow (budynki przetworcze) dla The Game -- czysty modul,
 * bez DOM, bez THREE, ZERO importow runtime.
 *
 * Kanon 2026-07-23 (B-SUROW-BUD-03, SUROWCE-KANON):
 *   Mielerz    | 2 drewno         | 1 paliwo     | 2/t
 *   Cegielnia  | 2 glina + 1 paliwo | 1 cegla    | 2/t
 *   Garncarnia | 1 glina + 1 paliwo | 1 ceramika | 1/t
 *   Piec hutniczy | 1 ruda + 1 paliwo | 1 braz  | 1/t
 *   Odlewnia żelaza | 1 ruda_zelaza + 1 paliwo | 1 zelazo | 1/t
 *   Wielka kuźnia | 1 zelazo + 1 paliwo | 1 stal  | 1/t
 *   Stolarnia / Tartak — NIE konwertują (drewno TYP 1; deski wycofane).
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
  id:                 string;
  inputs:             Record<string, number>;
  output:             string;
  outputAmount:       number;
  throughputParamKey: string;
  throughputFallback: number;
}

/** Domyslny zestaw receptur (SUROWCE-KANON 2026-07-23). */
export const DEFAULT_CONVERTER_RECIPES: ReadonlyArray<ConverterRecipe> = [
  { id: 'mielerz',          inputs: { drewno: 2 },                   output: 'paliwo',   outputAmount: 1, throughputParamKey: 'budynek_mielerz_przepustowosc',    throughputFallback: 2 },
  { id: 'cegielnia',        inputs: { glina: 2, paliwo: 1 },         output: 'cegla',    outputAmount: 1, throughputParamKey: 'budynek_cegielnia_przepustowosc',  throughputFallback: 2 },
  { id: 'garncarnia',       inputs: { glina: 1, paliwo: 1 },         output: 'ceramika', outputAmount: 1, throughputParamKey: 'budynek_garncarnia_przepustowosc', throughputFallback: 1 },
  { id: 'huta',             inputs: { ruda: 1, paliwo: 1 },          output: 'braz',     outputAmount: 1, throughputParamKey: 'budynek_huta_przepustowosc',       throughputFallback: 1 },
  { id: 'odlewnia_brazu',   inputs: { ruda: 1, paliwo: 1 },          output: 'braz',     outputAmount: 1, throughputParamKey: 'budynek_huta_przepustowosc',       throughputFallback: 1 },
  { id: 'odlewnia_zelaza',  inputs: { ruda_zelaza: 1, paliwo: 1 },    output: 'zelazo',   outputAmount: 1, throughputParamKey: 'budynek_odlewnia_zelaza_przepustowosc', throughputFallback: 1 },
  { id: 'wielka_kuznia',    inputs: { zelazo: 1, paliwo: 1 },        output: 'stal',     outputAmount: 1, throughputParamKey: 'budynek_wielka_kuznia_przepustowosc', throughputFallback: 1 },
];

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
