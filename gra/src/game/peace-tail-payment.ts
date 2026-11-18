/**
 * R-WEB-DIPLO-PEACE-LAST-STAGE-GOLD-ORES-Q1 (ABC właściciela 2026-11-18): płatność ostatniego stopnia ceny pokoju.
 *
 * Kolejność zapłaty ceny pokoju (strona słabsza):
 *   1. MIASTA (planCityPeacePayment: najtańsze pokrywające resztę; stolica i ostatnie miasto NIGDY);
 *   2. dopiero gdy miasta nie wystarczą — reszta ZŁOTEM, potem METALAMI I RUDAMI wg `ogonPokoju.kolejnosc`
 *      w war-weariness-params.json (domyślnie: złoto → brąz → żelazo → ruda miedzi → ruda cyny → ruda żelaza).
 *
 * Funkcja czysta: nie czyta stanu gry. Wycena (PN za 1 sztukę) i zapasy płatnika podaje wywołujący
 * (katalog wartości diplomacy-value-catalog, Spichlerz/Skarbiec). Zapasy nigdy nie schodzą poniżej zera;
 * brak zapasów → `shortfallPn` > 0 (pokój jak dziś: „Brakuje N PW").
 *
 * NIE wchodzą do ogona: technologie, praca, pieniądze ¤ (ZAŁOŻENIE do potwierdzenia przez właściciela).
 */
import paramsRaw from '../../data/war-weariness-params.json';
import { planCityPeacePayment, type PeaceAsset } from './diplomacy-ai-forced-peace';
import { diplomacyHandelSurowiecCenaZaBlok, diplomacyHandelSurowiecKrok } from './diplomacy-value-catalog';

const ORDER_FROM_DATA = (paramsRaw as unknown as { ogonPokoju?: { kolejnosc?: string[] } }).ogonPokoju?.kolejnosc;

/** Kolejność surowców ogona pokoju (dane: war-weariness-params.json → ogonPokoju.kolejnosc). */
export const PEACE_TAIL_ORDER: readonly string[] = Object.freeze([...(ORDER_FROM_DATA ?? [])]);

/**
 * PN za 1 sztukę surowca ogona z katalogu wartości (diplomacy-value-catalog: cena za blok / krok bloku, ta sama
 * wycena co handel surowcami). Brak wyceny albo cena <= 0 → null (surowiec pomijany w ogonie).
 */
export function peaceTailPnPerUnit(key: string, era?: number): number | null {
  const cena = diplomacyHandelSurowiecCenaZaBlok(key, era);
  if (cena == null || !(cena > 0)) return null;
  const krok = diplomacyHandelSurowiecKrok(key, era);
  return cena / (krok > 1 ? krok : 1);
}

export interface PeaceTailItem {
  /** Klucz surowca (zloto, braz, zelazo, ruda, ruda_cyny, ruda_zelaza). */
  key: string;
  /** Ile sztuk płatnik oddaje (całkowite, > 0). */
  qty: number;
  /** Wartość pozycji w PN (qty × PN za sztukę). */
  pn: number;
}

export interface PeaceSettlement {
  /** Miasta użyte w pierwszym stopniu (kolejność jak w planCityPeacePayment). */
  cities: PeaceAsset[];
  /** Składnik ogona: złoto → metale → rudy, tylko pozycje > 0. */
  tail: PeaceTailItem[];
  coveredByCitiesPn: number;
  coveredByTailPn: number;
  /** Niedobór po miastach i ogonie (>= 0). */
  shortfallPn: number;
  /** Cała cena pokryta (shortfallPn === 0). */
  full: boolean;
}

export interface PeaceSettlementInput {
  /** Cena pokoju do pokrycia w PN (strona płacąca). Zero → pusta płatność (np. r = 1 ⇒ D = 0). */
  duePn: number;
  /** Miasta płatnika jako aktywa PW (forbidden = stolica / ostatnie miasto). */
  cities: readonly PeaceAsset[];
  /** Zapasy płatnika w sztukach (Spichlerz/Skarbiec). Brak klucza = 0. */
  holdings: Readonly<Record<string, number>>;
  /** PN za 1 sztukę surowca; null/0 = surowiec nie jest wyceniony (pomijany). */
  pnPerUnit: (key: string) => number | null | undefined;
  /** Kolejność ogona; domyślnie PEACE_TAIL_ORDER. */
  order?: readonly string[];
}

/** Liczy płatność ceny pokoju: najpierw miasta, potem ogon (złoto → brąz → żelazo → rudy). Czysta. */
export function settlePeaceDue(input: PeaceSettlementInput): PeaceSettlement {
  const need = Math.max(0, Math.ceil(Number.isFinite(input.duePn) ? input.duePn : 0));
  const order = input.order ?? PEACE_TAIL_ORDER;

  const cityPlan = planCityPeacePayment(need, input.cities, Number.POSITIVE_INFINITY);
  const coveredByCitiesPn = cityPlan.coveredPn;
  let rem = Math.max(0, need - coveredByCitiesPn);

  const tail: PeaceTailItem[] = [];
  let coveredByTailPn = 0;
  for (const key of order) {
    if (rem <= 0) break;
    const price = input.pnPerUnit(key);
    if (price == null || !(price > 0)) continue;
    const have = Math.max(0, Math.floor(input.holdings[key] ?? 0));
    if (have <= 0) continue;
    const unitsNeeded = Math.ceil(rem / price);
    const qty = Math.min(have, unitsNeeded);
    const pn = Math.round(qty * price);
    tail.push({ key, qty, pn });
    const paid = Math.min(pn, rem);
    coveredByTailPn += paid;
    rem -= paid;
  }

  return {
    cities: cityPlan.items,
    tail,
    coveredByCitiesPn,
    coveredByTailPn,
    shortfallPn: Math.max(0, rem),
    full: rem <= 0,
  };
}
