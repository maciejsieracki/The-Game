/**
 * converters.ts
 * Przetworstwo surowcow (budynki przetworcze) dla The Game -- czysty modul,
 * bez DOM, bez THREE, ZERO importow runtime.
 *
 * Kanon 2026-07-23 (CERAMIKA-DOSTEP + PALIWO USUNIETE, supersedes B-SUROW-BUD-03/SUROWCE-KANON):
 *   - Ceramika = tylko dostep (Garncarnia zbudowana) -- receptura garncarni USUNIETA.
 *   - Paliwo USUNIETE calkowicie (Mielerz usuniety); konwertery biora DREWNO 1:1 zamiast paliwa.
 *   Cegielnia  | 2 glina + 1 drewno | 1 cegla    | 2/t (cel 3/t -- decyzja C-SUROW-CEGLA=A)
 *   Odlewnia brązu | 1 ruda + 1 drewno | 1 braz  | 1/t
 *   Odlewnia żelaza | braz (jak tier1) + żelazo (1 ruda_zelaza + 1 drewno) | 1/t kazdy
 *   Wielka odlewnia | braz + żelazo + stal (1 zelazo + 1 drewno) | 1/t kazdy
 *   Stolarnia / Tartak — NIE konwertują (drewno TYP 1; deski wycofane).
 *   Garncarnia — NIE konwertuje (Maciej 2026-07-23): Ceramika przestaje być
 *     surowcem magazynowym. Garncarnia zbudowana = czysty DOSTĘP (etykieta
 *     'Ceramika' w main.ts empireActiveResourceLabelsForOwner + bramka
 *     building-resource-gate.ts Spichlerz), bez ilości w City.surowce.
 *
 * Lancuch odlewni (Maciej 2026-07-27): jeden slot, upgrade zastępuje poprzednik.
 * Wielka Kuźnia = tylko Pancerz (+15% lancuch), NIE produkuje stali.
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
 * Domyslny zestaw receptur (SUROWCE-KANON 2026-07-23, zaktualizowany 2026-07-27:
 * lancuch odlewni multi-receptura; Wielka Kuźnia bez produkcji stali).
 */
export const DEFAULT_CONVERTER_RECIPES: ReadonlyArray<ConverterRecipe> = [
  { id: 'cegielnia',              inputs: { glina: 2, drewno: 1 },         output: 'cegla',    outputAmount: 1, throughputParamKey: 'budynek_cegielnia_przepustowosc',        throughputFallback: 3 },
  // 'garncarnia' USUNIETA (Maciej 2026-07-23): Ceramika = tylko dostep (Garncarnia
  // zbudowana), nie sztuki w magazynie -- patrz komentarz kanonu powyzej.
  // 'mielerz' USUNIETY (Maciej 2026-07-23): Paliwo usuniete calkowicie; konwertery biora drewno 1:1.
  { id: 'huta',                    inputs: { ruda: 1, drewno: 1 },          output: 'braz',     outputAmount: 1, throughputParamKey: 'budynek_huta_przepustowosc',             throughputFallback: 1 },
  { id: 'odlewnia_brazu',          inputs: { ruda: 1, drewno: 1 },          output: 'braz',     outputAmount: 1, throughputParamKey: 'budynek_huta_przepustowosc',             throughputFallback: 1 },
  { id: 'odlewnia_zelaza__braz',   buildingId: 'odlewnia_zelaza', inputs: { ruda: 1, drewno: 1 },          output: 'braz',     outputAmount: 1, throughputParamKey: 'budynek_huta_przepustowosc',             throughputFallback: 1 },
  { id: 'odlewnia_zelaza__zelazo', buildingId: 'odlewnia_zelaza', inputs: { ruda_zelaza: 1, drewno: 1 },    output: 'zelazo',   outputAmount: 1, throughputParamKey: 'budynek_odlewnia_zelaza_przepustowosc', throughputFallback: 1 },
  { id: 'wielka_odlewnia__braz',   buildingId: 'wielka_odlewnia', inputs: { ruda: 1, drewno: 1 },          output: 'braz',     outputAmount: 1, throughputParamKey: 'budynek_huta_przepustowosc',             throughputFallback: 1 },
  { id: 'wielka_odlewnia__zelazo', buildingId: 'wielka_odlewnia', inputs: { ruda_zelaza: 1, drewno: 1 },    output: 'zelazo',   outputAmount: 1, throughputParamKey: 'budynek_odlewnia_zelaza_przepustowosc', throughputFallback: 1 },
  { id: 'wielka_odlewnia__stal',   buildingId: 'wielka_odlewnia', inputs: { zelazo: 1, drewno: 1 },        output: 'stal',     outputAmount: 1, throughputParamKey: 'budynek_wielka_odlewnia_przepustowosc',  throughputFallback: 1 },
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

/** Klucz budynku dla dopasowania receptury do runtimeBuiltIds. */
export function converterBuildingIdForRecipe(recipe: ConverterRecipe): string {
  return recipe.buildingId ?? recipe.id;
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
