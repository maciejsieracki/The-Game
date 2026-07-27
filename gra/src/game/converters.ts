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
 *   Cegielnia  | 2 glina + 1 drewno | 1 cegla    | 3/t
 *   Garncarnia | 1 glina + 1 drewno | 1 ceramika | 6/t (PYTANIE-84-B5)
 *   Odlewnia brązu | 1 ruda + 1 drewno | 1 braz  | 1/t
 *   Odlewnia żelaza | braz (jak tier1) + żelazo (1 ruda_zelaza + 1 drewno) | 1/t każdy
 *   Wielka odlewnia | braz + żelazo + stal (1 zelazo + 1 drewno) | 1/t każdy
 *   Stolarnia / Tartak — NIE konwertują (drewno TYP 1; deski wycofane).
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
 * Domyślny zestaw receptur (PYTANIE-84 2026-07-27: Ceramika stock + Garncarnia konwerter;
 * łańcuch odlewni multi-receptura; Wielka Kuźnia bez produkcji stali).
 */
export const DEFAULT_CONVERTER_RECIPES: ReadonlyArray<ConverterRecipe> = [
  { id: 'cegielnia',              inputs: { glina: 2, drewno: 1 },         output: 'cegla',    outputAmount: 1, throughputParamKey: 'budynek_cegielnia_przepustowosc',        throughputFallback: 3 },
  { id: 'garncarnia',             inputs: { glina: 1, drewno: 1 },         output: 'ceramika', outputAmount: 1, throughputParamKey: 'budynek_garncarnia_przepustowosc',     throughputFallback: 6 },
  // 'mielerz' USUNIĘTY (Maciej 2026-07-23): Paliwo usunięte całkowicie; konwertery biorą drewno 1:1.
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
