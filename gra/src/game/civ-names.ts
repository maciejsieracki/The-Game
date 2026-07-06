/**
 * civ-names.ts — nazwy klastra z civs.json (D-START N-1A…N-5B).
 * Lane CYWILIZACJE · pure functions · bez DOM.
 */

import type { CivDef, CivsData } from '../data/loader';

export const NAZWY_KLASTRA_LEN = 10;

/** Zwraca cywilizację po ikonaId (np. 'grecy'). */
export function findCivByIkonaId(civs: CivsData, ikonaId: string): CivDef | undefined {
  return civs.cywilizacje.find(c => c.ikonaId === ikonaId);
}

/** Lista nazwyKlastra dla typu; pusta tablica gdy brak wpisu. */
export function getNazwyKlastra(civs: CivsData, ikonaId: string): readonly string[] {
  const def = findCivByIkonaId(civs, ikonaId);
  return def?.nazwyKlastra ?? [];
}

/** Bezpieczny odczyt indeksu (N-3A: stała kolejność z JSON). */
export function nazwaKlastraAt(
  names: readonly string[],
  index: number,
  fallback: string,
): string {
  if (index >= 0 && index < names.length && names[index]) {
    return names[index] as string;
  }
  return fallback;
}

/** N-1A: pierwsze miasto gracza = nazwyKlastra[0]. */
export function playerStartCityName(civs: CivsData, playerCivId: string): string {
  const names = getNazwyKlastra(civs, playerCivId);
  return nazwaKlastraAt(names, 0, 'Stolica');
}

/** N-2A / N-3A: i-ty rywal klastra (1-based) = nazwyKlastra[i]. */
export function clusterRivalCityName(
  civs: CivsData,
  playerCivId: string,
  rivalIndex1Based: number,
): string {
  const names = getNazwyKlastra(civs, playerCivId);
  return nazwaKlastraAt(names, rivalIndex1Based, `Rywal ${rivalIndex1Based}`);
}

/** Stolica obcego typu = nazwyKlastra[0] danego typu. */
export function foreignCapitalCityName(civs: CivsData, typIkonaId: string): string {
  const names = getNazwyKlastra(civs, typIkonaId);
  return nazwaKlastraAt(names, 0, typIkonaId);
}

/** Etykieta pełnej dyplomacji — nazwa nacji z JSON. */
export function civDisplayName(civs: CivsData, ikonaId: string): string {
  const def = findCivByIkonaId(civs, ikonaId);
  return def?.Cywilizacja ?? ikonaId;
}

/** Walidacja danych (dev/test): każdy typ ma 10 nazw. */
export function validateNazwyKlastra(civs: CivsData): string[] {
  const errs: string[] = [];
  for (const c of civs.cywilizacje) {
    const id = c.ikonaId ?? c.Cywilizacja;
    const n = c.nazwyKlastra?.length ?? 0;
    if (n !== NAZWY_KLASTRA_LEN) {
      errs.push(`${id}: oczekiwano ${NAZWY_KLASTRA_LEN} nazw, jest ${n}`);
    }
  }
  return errs;
}
