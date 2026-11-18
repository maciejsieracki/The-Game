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
import { planCityPeacePayment, type PeaceAsset, type PeacePaymentPlan } from './diplomacy-ai-forced-peace';
import { diplomacyHandelSurowiecCenaZaBlok, diplomacyHandelSurowiecKrok, diplomacyPnZloto } from './diplomacy-value-catalog';

const ORDER_FROM_DATA = (paramsRaw as unknown as { ogonPokoju?: { kolejnosc?: string[] } }).ogonPokoju?.kolejnosc;

/** Kolejność surowców ogona pokoju (dane: war-weariness-params.json → ogonPokoju.kolejnosc). */
export const PEACE_TAIL_ORDER: readonly string[] = Object.freeze([...(ORDER_FROM_DATA ?? [])]);

/**
 * PN za 1 sztukę surowca ogona. Złoto = Skarbiec państwa (decyzja właściciela C): 1 ¤ = `diplomacyPnZloto(1)` PN — dokładnie
 * ta sama wycena, którą stosuje przelew `transferBasketItems` (typ „zloto"), więc wartość zapłaty = wartość pozycji.
 * Metale i rudy: cena za blok / krok bloku z katalogu wartości (diplomacy-value-catalog, ta sama wycena co handel
 * surowcami). Brak wyceny albo cena <= 0 → null (surowiec pomijany w ogonie).
 */
export function peaceTailPnPerUnit(key: string, era?: number): number | null {
  if (key === 'zloto') {
    const u = diplomacyPnZloto(1);
    return u > 0 ? u : null;
  }
  const cena = diplomacyHandelSurowiecCenaZaBlok(key, era);
  if (cena == null || !(cena > 0)) return null;
  const krok = diplomacyHandelSurowiecKrok(key, era);
  return cena / (krok > 1 ? krok : 1);
}

/** Krok (w sztukach) transferu surowca ogona: metale/rudy idą w blokach epoki; złoto po 1. */
export function peaceTailStep(key: string, era?: number): number {
  if (key === 'zloto') return 1;
  const k = diplomacyHandelSurowiecKrok(key, era);
  return k > 1 ? Math.floor(k) : 1;
}

/** Nazwy surowców ogona w dopełniaczu (tooltip „Dopłata: X złota, Y rudy żelaza"). */
export const PEACE_TAIL_LABEL_GEN: Readonly<Record<string, string>> = Object.freeze({
  zloto: 'złota', braz: 'brązu', zelazo: 'żelaza', ruda: 'rudy miedzi', ruda_cyny: 'rudy cyny', ruda_zelaza: 'rudy żelaza',
});

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

export interface PeaceTailPricing {
  /** Zapasy płatnika w sztukach (Skarbiec: zloto; Spichlerz państwa: brąz/żelazo/rudy). Brak klucza = 0. */
  holdings: Readonly<Record<string, number>>;
  /** PN za 1 sztukę surowca; null/0 = surowiec nie jest wyceniony (pomijany). */
  pnPerUnit: (key: string) => number | null | undefined;
  /** Krok transferu (sztuki w bloku); domyślnie 1. */
  stepOf?: (key: string) => number;
  /** Kolejność ogona; domyślnie PEACE_TAIL_ORDER (dane). */
  order?: readonly string[];
}

export interface PeaceTailResult {
  tail: PeaceTailItem[];
  coveredPn: number;
  shortfallPn: number;
}

/**
 * Składa ogon (złoto → brąz → żelazo → rudy wg kolejności z danych) z reszty ceny `restPn` po miastach.
 * Zapasy nigdy poniżej zera; ilości zaokrąglane w górę do kroku bloku, ale nie ponad zapas (floor do kroku).
 * Funkcja czysta; reszta <= 0 → pusty ogon.
 */
export function composePeaceTail(restPn: number, pricing: PeaceTailPricing): PeaceTailResult {
  let rem = Math.max(0, Math.ceil(Number.isFinite(restPn) ? restPn : 0));
  const order = pricing.order ?? PEACE_TAIL_ORDER;
  const tail: PeaceTailItem[] = [];
  let covered = 0;
  for (const key of order) {
    if (rem <= 0) break;
    const price = pricing.pnPerUnit(key);
    if (price == null || !(price > 0)) continue;
    const step = Math.max(1, Math.floor(pricing.stepOf?.(key) ?? 1));
    const haveRaw = Math.max(0, Math.floor(pricing.holdings[key] ?? 0));
    const have = Math.floor(haveRaw / step) * step;
    if (have <= 0) continue;
    const unitsNeeded = Math.ceil(Math.ceil(rem / price) / step) * step;
    const qty = Math.min(have, unitsNeeded);
    if (qty <= 0) continue;
    const pn = Math.round(qty * price);
    tail.push({ key, qty, pn });
    const paid = Math.min(pn, rem);
    covered += paid;
    rem -= paid;
  }
  return { tail, coveredPn: covered, shortfallPn: Math.max(0, rem) };
}

export interface PeaceSettlementInput extends PeaceTailPricing {
  /** Cena pokoju do pokrycia w PN (strona płacąca). Zero → pusta płatność (np. r = 1 ⇒ D = 0). */
  duePn: number;
  /** Miasta płatnika jako aktywa PW (forbidden = stolica / ostatnie miasto). */
  cities: readonly PeaceAsset[];
  /** Maks. liczba miast w pierwszym stopniu (domyślnie bez limitu; 0 = brak miast, np. bitwa w toku). */
  maxCities?: number;
}

/** Liczy płatność ceny pokoju: najpierw miasta, potem ogon (złoto → brąz → żelazo → rudy). Czysta. */
export function settlePeaceDue(input: PeaceSettlementInput): PeaceSettlement {
  const need = Math.max(0, Math.ceil(Number.isFinite(input.duePn) ? input.duePn : 0));
  const cityPlan = planCityPeacePayment(need, input.cities, input.maxCities ?? Number.POSITIVE_INFINITY);
  const coveredByCitiesPn = cityPlan.coveredPn;
  const rem = Math.max(0, need - coveredByCitiesPn);
  const t = composePeaceTail(rem, input);
  return {
    cities: cityPlan.items,
    tail: t.tail,
    coveredByCitiesPn,
    coveredByTailPn: t.coveredPn,
    shortfallPn: t.shortfallPn,
    full: t.shortfallPn <= 0,
  };
}

/** Pozycja ogona jako aktywo planu pokoju (złoto = typ „zloto" w ¤; metale/rudy = „surowiec_ilosc"). */
export function peaceTailItemAsAsset(it: PeaceTailItem): PeaceAsset {
  return { kind: it.key === 'zloto' ? 'zloto' : 'surowiec_ilosc', id: it.key, amount: it.qty, pn: it.pn };
}

/**
 * Plan zapłaty pokoju w formie `PeacePaymentPlan` (miasta, potem ogon): TA SAMA funkcja (settlePeaceDue) dla pokoju AI↔AI
 * (runAiAiPeaceTick / runWarWearinessTick: `tailPlan`), ścieżki AI i gracza. `coveredPn` = miasta + ogon (PN pozycji).
 */
export function peacePlanWithTail(input: PeaceSettlementInput): PeacePaymentPlan {
  const s = settlePeaceDue(input);
  const tailAssets = s.tail.map(peaceTailItemAsAsset);
  const items: PeaceAsset[] = [...s.cities, ...tailAssets];
  const histogram = { zloto: 0, surowiec_ilosc: 0, miasto: 0 };
  for (const it of items) histogram[it.kind] += 1;
  return {
    items,
    coveredPn: s.coveredByCitiesPn + s.tail.reduce((a, t) => a + t.pn, 0),
    shortfallPn: s.shortfallPn,
    full: s.full,
    histogram,
  };
}

/** Zapasy płatnika dla kolejności ogona: złoto ze Skarbca państwa, pozostałe ze Spichlerza państwa (pula surowców). */
export function peaceTailHoldings(
  treasuryGold: number,
  stockOf: (key: string) => number,
  order: readonly string[] = PEACE_TAIL_ORDER,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const k of order) {
    const v = k === 'zloto' ? treasuryGold : stockOf(k);
    out[k] = Math.max(0, Math.floor(Number.isFinite(v) ? v : 0));
  }
  return out;
}

/** Zależności okablowania (w grze: ownerTreasury, ownerResourceStock, dealTradeEraForOwners z main.ts). */
export interface PeaceTailWiringDeps {
  treasuryOf: (ownerId: number) => number;
  stockOf: (ownerId: number, key: string) => number;
  eraOf: (ownerA: number, ownerB: number) => 1 | 2 | 3;
}

/**
 * Wycena i zapasy PŁATNIKA ogona (r4, zarzut Evaluatora 1): jedyne miejsce, w którym zapasy płatnika są składane
 * z getterów stanu gry. `payerId` = strona płacąca (nie zawsze proponent), `partnerId` = druga strona.
 * Zapasy czytane WYŁĄCZNIE dla `payerId` (treasuryOf/stockOf), epoka wyceny z eraOf(payer, partner).
 */
export function peaceTailPricingForPayer(
  payerId: number,
  partnerId: number,
  deps: PeaceTailWiringDeps,
  order: readonly string[] = PEACE_TAIL_ORDER,
): PeaceTailPricing {
  const era = deps.eraOf(payerId, partnerId);
  return {
    holdings: peaceTailHoldings(deps.treasuryOf(payerId), k => deps.stockOf(payerId, k), order),
    pnPerUnit: k => peaceTailPnPerUnit(k, era),
    stepOf: k => peaceTailStep(k, era),
  };
}

/** Strona płacąca pokój: jeśli autor oferty daje (giveItems) — autor; jeśli żąda (receiveItems) — druga strona. */
export function peacePayerOwner(proposerId: number, responderId: number, authorGives: boolean): number {
  return authorGives ? proposerId : responderId;
}

/** Tekst „Dopłata: X złota, Y rudy żelaza" (pusty ciąg bez ogona). */
export function peaceTailLabel(tail: readonly PeaceTailItem[]): string {
  if (!tail.length) return '';
  return 'Dopłata: ' + tail.map(t => `${t.qty} ${PEACE_TAIL_LABEL_GEN[t.key] ?? t.key}`).join(', ');
}

/** Pozycje koszyka (typ/id/ilosc) dla ogona — wykonanie przez transferBasketItems. */
export function peaceTailBasketItems(tail: readonly PeaceTailItem[]): Array<{ typ: 'zloto' | 'surowiec_ilosc'; id: string; ilosc: number }> {
  return tail.map(t => ({ typ: t.key === 'zloto' ? 'zloto' as const : 'surowiec_ilosc' as const, id: t.key, ilosc: t.qty }));
}
