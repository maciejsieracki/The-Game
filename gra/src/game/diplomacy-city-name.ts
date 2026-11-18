/**
 * R-WEB-UI-DIPLO-OFFER-CITY-NAMES-RAW-ID-Q1 — nazwa miasta w tekstach dla gracza w dyplomacji.
 *
 * Pozycje oferty typu 'miasto' niosą `id` = cityId (surowy identyfikator silnika). Bez tej
 * warstwy UI pokazywało go wprost przez `humanizeId`/`nazwaWyswietlana` (np. „City27”).
 *
 * Rejestr jest wstrzykiwany przez main.ts (`setDiplomacyCityNameResolver`) — ten plik nie
 * zna listy miast, więc nie zależy od main.ts ani od warstwy UI.
 *
 * Kolejność rozstrzygania:
 *  1. `cityLabel` z pozycji oferty, jeśli to jawna nazwa (nie wygląda na surowe id);
 *  2. resolver (main.ts): nazwa miasta, a przy braku nazwy „miasto <cywilizacja właściciela>”;
 *  3. zawsze czytelny zastępnik „miasto” — NIGDY surowe id.
 *
 * EN: resolves a player-facing city name for diplomacy offers; never returns a raw city id.
 */

export type DiplomacyCityNameResolver = (cityId: string) => string | null | undefined;

let resolver: DiplomacyCityNameResolver | null = null;

/** Rejestruje (lub czyści, gdy `null`) źródło nazw miast dla UI dyplomacji. */
export function setDiplomacyCityNameResolver(fn: DiplomacyCityNameResolver | null): void {
  resolver = fn;
}

/** Surowy identyfikator miasta wygląda jak `City27`, `city_12`, `c-3` — nie jest nazwą. */
const SUROWE_ID_MIASTA = /^[A-Za-z]+[_-]?\d+$/;

function czyJawnaNazwa(s: string | null | undefined): s is string {
  const t = (s ?? '').trim();
  return t !== '' && !SUROWE_ID_MIASTA.test(t);
}

/**
 * Nazwa miasta do wyświetlenia w dyplomacji. Nigdy nie zwraca surowego id miasta.
 * @param cityId — id miasta z pozycji oferty.
 * @param cityLabel — opcjonalna nazwa z pozycji oferty (np. z wyceny PW).
 */
export function nazwaMiastaDyplomacji(cityId: string, cityLabel?: string | null): string {
  if (czyJawnaNazwa(cityLabel)) return cityLabel.trim();
  let zRejestru: string | null | undefined = null;
  try {
    zRejestru = resolver ? resolver(cityId) : null;
  } catch {
    zRejestru = null;
  }
  if (czyJawnaNazwa(zRejestru)) return zRejestru.trim();
  return 'miasto';
}
