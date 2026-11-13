/**
 * R-WEB-SIEGE-SURRENDER-ENTER-CITY-Q1 -- po kapitulacji obleganego miasta oblegająca armia
 * WCHODZI na heks miasta (zamiast stać pod murem).
 *
 * Czysty moduł (bez DOM/THREE/stanu globalnego). Wołany z main.ts `resolveSiegeSurrender`
 * PO zmianie właściciela miasta, a PRZED `endMapSiege` (który kasuje `oblegaCityId`).
 *
 * ZAŁOŻENIA (dispatch):
 *  Z1. Gracz, AI i barbarzyńcy jednakowo (brak rozgałęzień po ownerId).
 *  Z2. Wchodzi JEDNA główna armia: stos (heks) oblegających jednostek zdobywcy o największej
 *      liczbie jednostek niecywilnych; remis -> stos z generałem; dalszy remis -> najmniejsze
 *      (leksykograficznie) id w stosie. Pozostałe stosy zostają na swoich heksach.
 *  Z3. Wejście bez kosztu ruchu i bez walki; `ruchLeft` bez zmian; zdjęcie `inGarnizon` oraz
 *      `ufortyfikowanyWPolu` (fortyfikacja polowa nie ma sensu w mieście).
 *  Z4. Jeśli na heksie miasta stoi jednostka INNEGO właściciela niż zdobywca -- nikt nie wchodzi.
 *  Z5. Wchodzą jednostki niecywilne (w tym machiny oblężnicze -- jak przy szturmie); cywilne
 *      (osadnik/robotnik/zwiadowca) i zaokrętowane zostają na heksie.
 */

export interface SiegeEnterUnit {
  id: string;
  ownerId: number;
  typeId: string;
  category: string;
  q: number;
  r: number;
  oblegaCityId?: string;
  isGeneral?: boolean;
  embarked?: boolean;
  inGarnizon?: boolean;
  ufortyfikowanyWPolu?: boolean;
}

export interface SiegeEnterCity {
  id: string;
  q: number;
  r: number;
}

export interface SiegeEnterDeps {
  isCivilian: (u: SiegeEnterUnit) => boolean;
  /**
   * R-WEB-ARMY-STACK-LIMIT-Q1: limit jednostek w jednej armii (heks miasta). Wejscie grupy, ktora
   * nie miesci sie w stosie miasta (wlasne jednostki juz na heksie + grupa > limit), jest pomijane.
   * Brak pola = bez limitu (zachowanie sprzed zmiany).
   */
  stackLimit?: number;
}

/** Plan (bez mutacji): id jednostek wchodzących do miasta; [] = nikt. */
export function planSurrenderEntry(
  units: readonly SiegeEnterUnit[],
  city: SiegeEnterCity,
  newOwnerId: number,
  deps: SiegeEnterDeps,
): string[] {
  // Z4: obca jednostka na heksie miasta blokuje wejście.
  for (const u of units) {
    if (u.q === city.q && u.r === city.r && u.ownerId !== newOwnerId) return [];
  }
  const groups = new Map<string, SiegeEnterUnit[]>();
  for (const u of units) {
    if (u.ownerId !== newOwnerId || u.oblegaCityId !== city.id) continue;
    if (u.embarked === true || deps.isCivilian(u)) continue;
    if (u.q === city.q && u.r === city.r) continue; // już w mieście
    const key = u.q + ',' + u.r;
    const g = groups.get(key);
    if (g) g.push(u); else groups.set(key, [u]);
  }
  // R-WEB-ARMY-STACK-LIMIT-Q1: miejsce w stosie miasta (wlasne jednostki juz tam stojace).
  const room = deps.stackLimit === undefined
    ? Infinity
    : deps.stackLimit - units.filter(u => u.ownerId === newOwnerId && u.q === city.q && u.r === city.r).length;
  let best: SiegeEnterUnit[] | null = null;
  const minId = (g: SiegeEnterUnit[]): string => g.map(x => x.id).sort()[0]!;
  for (const g of groups.values()) {
    if (g.length > room) continue;
    if (!best) { best = g; continue; }
    if (g.length !== best.length) { if (g.length > best.length) best = g; continue; }
    const gGen = g.some(x => x.isGeneral === true);
    const bGen = best.some(x => x.isGeneral === true);
    if (gGen !== bGen) { if (gGen) best = g; continue; }
    if (minId(g) < minId(best)) best = g;
  }
  return best ? best.map(u => u.id).sort() : [];
}

/** Wykonuje plan (mutuje `units`). Zwraca wchodzące jednostki (posortowane po id). */
export function enterCityAfterSurrender<U extends SiegeEnterUnit>(
  units: U[],
  city: SiegeEnterCity,
  newOwnerId: number,
  deps: SiegeEnterDeps,
): U[] {
  const ids = new Set(planSurrenderEntry(units, city, newOwnerId, deps));
  const moved: U[] = [];
  for (const u of units) {
    if (!ids.has(u.id)) continue;
    u.q = city.q;
    u.r = city.r;
    if (u.inGarnizon) delete u.inGarnizon;
    if (u.ufortyfikowanyWPolu) delete u.ufortyfikowanyWPolu;
    moved.push(u);
  }
  return moved.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}
