/**
 * diplomacy-goods.ts — indeks dóbr handlowych PER WŁAŚCICIEL (domknięcie zaległości #3,
 * DYSPOZYCJA-WDROZENIE panelu dyplomacji dwustronnego, 2026-07-23).
 *
 * Pure moduł: zero DOM/THREE/mapy. SILNIK (main.ts) dostarcza już WYLICZONE dane:
 *   - `activeResourceLabels`: etykiety PL aktywnych surowców TEGO ownera — civ-wide
 *     (Brąz/Żelazo — bramki braz-access.ts/zelazo-access.ts) + per-city ulepszenia
 *     (Drewno/Kamień/Glina/Sól/Ruda/Koń/Owce/Lama/Trzoda — resource-access.ts
 *     `empireActiveResourceLabelsForOwner`, już generyczne per ownerId).
 *   - `citySurowceSum`: suma `City.surowce` (magazyn PER-MIASTO surowców logistycznych,
 *     cities.ts) po WSZYSTKICH miastach ownera — klucze ASCII zgodne z
 *     DEFAULT_CONVERTER_RECIPES (drewno/kamien/glina/ruda/cegla/braz). Ceramika
 *     CELOWO NIE kumuluje sztuk (Maciej 2026-07-23) — tylko dostęp (etykieta 'Ceramika'),
 *     stąd `ilosc` dla niej zawsze `undefined` niżej. Paliwo USUNIĘTE (konwertery biorą drewno).
 *
 * Przed tą zmianą main.ts (tradeGoodsForOwner) pokazywał TEN SAM globalny katalog
 * (diplomacyResourceAccessCatalog) po OBU stronach negocjacji — niezależnie od tego, czy
 * dany owner faktycznie POSIADA dany surowiec (patrz main.ts komentarz przy starym
 * tradeGoodsForOwner). Ten moduł buduje realny indeks — różny per owner.
 */

export interface OwnerGoodsIndexInput {
  /** Etykiety PL aktywnych surowców tego ownera (main.ts: diplomacyActiveResourceLabelsForOwner). */
  activeResourceLabels: readonly string[];
  /** Suma City.surowce (klucze ASCII) po wszystkich miastach ownera. */
  citySurowceSum: Readonly<Record<string, number>>;
}

/** Kategorie sekcji „Dobra handlowe" w audiencji dyplomacji (R-DYPLO-DOBRA-KAT). */
export type TradeGoodsCategories = {
  surowce: string[];
  technologie: string[];
  /** Slot na przyszłe dobra poza surowcami/techami — na razie puste (Q2=A: szary nagłówek). */
  inne: string[];
};

export interface TradeGoodEntry {
  /** Klucz ASCII — zgodny z diplomacyResourceAccessCatalog (surowiec_boolean w koszyku PN)
   *  tam, gdzie dane dobro ma cenę; w przeciwnym razie tylko do wyświetlenia (karty „Dobra
   *  handlowe"), nie do koszyka (brak wyceny PN — patrz diplomacyPnSurowiecBoolean). */
  key: string;
  /** Etykieta PL do wyświetlenia. */
  label: string;
  /** Ilość w magazynie (City.surowce) — obecna tylko dla dóbr ilościowych (v0.1: część
   *  surowców to czysty dostęp boolean — brąk/żelazo/koń/owce/lama/trzoda/sól — bez sztuk). */
  ilosc?: number;
}

/** Etykieta PL (resource-access.ts SUROWIEC_KEY_LABEL) → klucz ASCII (cities.ts surowce /
 *  diplomacy-value-catalog katalog PN). „Ruda żelaza" i „Ruda" dzielą jeden klucz PN ('ruda') —
 *  katalog cenowy nie rozróżnia typu złoża pod kopalnią (patrz diplomacyResourceAccessCatalog). */
const LABEL_TO_ASCII_KEY: Readonly<Record<string, string>> = {
  'Drewno': 'drewno',
  'Kamień': 'kamien',
  'Glina': 'glina',
  'Ruda': 'ruda',
  'Ruda żelaza': 'ruda',
  'Sól': 'sol',
  'Koń': 'kon',
  // Bydło/Owce/Lama celowo POMINIĘTE — nie są surowcami (decyzja Macieja 2026-07-23);
  // pastwiska dają tylko bonus żywności/produkcji, nie są dobrem handlowym. Koń zostaje.
  'Brąz': 'braz',
  'Żelazo': 'zelazo',
  'Cegła': 'cegla',
  'Ceramika': 'ceramika',
  'Złoto': 'zloto',
  'Węgiel': 'wegiel',
};

function asciiKeyForLabel(label: string): string {
  return LABEL_TO_ASCII_KEY[label] ?? label.trim().toLowerCase();
}

/**
 * Etykieta WYŚWIETLANA dóbr dyplomacji (tylko prezentacja — klucze danych `ruda` itd. bez zmian).
 * Dyplomacja nazywa surowiec „Ruda" (złoże miedzi, kopalnia_miedzi) → „Ruda miedzi" (obok „Ruda cyny").
 * Źródłowa etykieta „Ruda" zostaje w resource-access.ts (bramki budynków dopasowują po niej).
 */
const DISPLAY_LABEL_OVERRIDE: Readonly<Record<string, string>> = {
  'Ruda': 'Ruda miedzi',
};

function dyplomacjaDisplayLabel(label: string): string {
  return DISPLAY_LABEL_OVERRIDE[label] ?? label;
}

/**
 * Ceramika nie ma liczonego zapasu sztuk (Maciej 2026-07-23) — dla niej `ilosc` zostaje
 * `undefined` także przy aktywnym dostępie. Pozostałe aktywne surowce: brak/zero w magazynie
 * = `ilosc: 0` (widoczne „×0"). `ilosc: 0` NIE jest oferowalne: filtry ofert
 * (diplomacy-resource-trade-pick.ts, quantityTradableGoodOptions: maxQty > 0) i kupno
 * (buyerHave: ilosc > 0) traktują 0 jak brak.
 */
const NO_COUNT_KEYS: ReadonlySet<string> = new Set(['ceramika']);

/**
 * Indeks dóbr handlowych FAKTYCZNIE posiadanych przez ownera — nie katalog globalny.
 * Kolejność: najpierw aktywne surowce (z ilością, jeśli magazyn per-miasto ją zna), potem
 * ewentualna reszta magazynu (drewno/glina/etc. mogą istnieć w City.surowce zanim odblokuje
 * się „aktywny dostęp" — dopisujemy je też, żeby indeks był kompletny).
 */
export function tradableGoodsForOwner(input: OwnerGoodsIndexInput): TradeGoodEntry[] {
  const out: TradeGoodEntry[] = [];
  const seen = new Set<string>();

  for (const label of input.activeResourceLabels) {
    const key = asciiKeyForLabel(label);
    if (seen.has(key)) continue;
    seen.add(key);
    const qty = input.citySurowceSum[key];
    let ilosc: number | undefined;
    if (NO_COUNT_KEYS.has(key)) ilosc = undefined;
    else ilosc = typeof qty === 'number' && qty > 0 ? Math.floor(qty) : 0;
    out.push({
      key,
      label: dyplomacjaDisplayLabel(label),
      ilosc,
    });
  }

  for (const [key, qty] of Object.entries(input.citySurowceSum)) {
    if (seen.has(key) || typeof qty !== 'number' || !(qty > 0)) continue;
    seen.add(key);
    const rawLabel = key.charAt(0).toUpperCase() + key.slice(1);
    out.push({ key, label: dyplomacjaDisplayLabel(rawLabel), ilosc: Math.floor(qty) });
  }

  return out;
}

/** Etykieta wyświetlana w karcie „Dobra handlowe" (z ilością magazynu, jeśli znana). */
export function formatTradeGoodDisplayLabel(g: TradeGoodEntry): string {
  return g.ilosc != null ? g.label + ' ×' + g.ilosc : g.label;
}

/**
 * Buduje kategorie dóbr handlowych bez limitu długości (R-DYPLO-DOBRA-KAT-Q3=A).
 * `techNames` — już przetłumaczone nazwy PL (main.ts: ownerResearchedTechs + techNameFromSlug).
 */
export function tradeGoodsCategoriesFromParts(
  goods: readonly TradeGoodEntry[],
  techNames: readonly string[],
): TradeGoodsCategories {
  return {
    surowce: goods.map(formatTradeGoodDisplayLabel),
    technologie: [...techNames],
    inne: [],
  };
}

/** Sumuje N rekordów City.surowce (main.ts: po wszystkich miastach jednego ownera). */
export function sumCitySurowce(
  records: ReadonlyArray<Readonly<Record<string, number>> | undefined | null>,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const rec of records) {
    if (!rec) continue;
    for (const [k, v] of Object.entries(rec)) {
      if (typeof v !== 'number' || !Number.isFinite(v)) continue;
      out[k] = (out[k] ?? 0) + v;
    }
  }
  return out;
}
