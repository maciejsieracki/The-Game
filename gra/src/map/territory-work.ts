/**
 * territory-work.ts — filtrowanie pracy obywateli wg właściciela terytorium.
 * Rozstrzyga overlap zasięgów miast (territoryOwnerAt → najbliższe centrum).
 */
import type { City } from '../game/cities';
import { territoryOwnerAt, type TerritoryNode } from './territory';

export type { TerritoryNode };

export function buildTerritoryNodesFromCities(
  cities: ReadonlyArray<Pick<City, 'q' | 'r' | 'population' | 'ownerId'>>,
): TerritoryNode[] {
  return cities.map(c => ({
    q: c.q,
    r: c.r,
    pop: c.population,
    level: 1,
    ownerId: c.ownerId,
  }));
}

/**
 * Heks należy do państwa ownerId (overlap → najbliższe miasto w promieniu).
 * Brak węzłów terytorium → false (fail-closed: nie budujemy / nie obsadzamy bez danych).
 */
export function isTerritoryHexOwnedBy(
  q: number,
  r: number,
  ownerId: number,
  territoryNodes: readonly TerritoryNode[],
): boolean {
  if (!territoryNodes.length) return false;
  return territoryOwnerAt(q, r, territoryNodes) === ownerId;
}

/** Łączy filtr terenu (morze/góry) z własnością państwa miasta. */
export function makeTerritoryWorkableFilter(
  territoryNodes: readonly TerritoryNode[],
  ownerId: number,
  baseWorkable?: (q: number, r: number) => boolean,
): (q: number, r: number) => boolean {
  return (q, r) => {
    if (baseWorkable && !baseWorkable(q, r)) return false;
    return isTerritoryHexOwnedBy(q, r, ownerId, territoryNodes);
  };
}

/**
 * Klucze "q,r" centrów WSZYSTKICH miast na mapie (dowolny właściciel) — do
 * defensywnego sprzątania starych ręcznych wpisów sprzed naprawy
 * P-HEKS-CENTRUM-OBCEGO-MIASTA (2026-08-13, patrz game/okolica.ts). Centrum miasta
 * NIGDY nie może być legalnym wpisem w okolicaReczne — bezwarunkowo, niezależnie od
 * tego, czyje jest centrum (własne lub cudze).
 */
export function cityCenterKeys(cities: ReadonlyArray<Pick<City, 'q' | 'r'>>): Set<string> {
  const out = new Set<string>();
  for (const c of cities) out.add(`${c.q},${c.r}`);
  return out;
}

/**
 * Wersja BEZ MUTACJI tej samej reguły legalności co pętla w
 * `reconcileWorkedTilesForOwner` niżej (centrum/terytorium/lostToSibling) — do
 * reużycia przez panel miasta, żeby wizualnie oznaczyć wpis `okolicaReczne`,
 * który reconcile i tak usunie na koniec tury/przy najbliższej zmianie
 * właściciela/load'zie, ale jeszcze go nie zdążył (P-MILET-ATENY-OKOLICA-RECZNE-
 * PRZY-PRZEJECIU-PANEL, 2026-08-14, N2 punkt 3). Klucz niesparsowalny → `true`
 * (celowo "legalny"/nieoznaczany — dokładnie jak `continue` bez usunięcia w
 * `reconcileWorkedTilesForOwner`, nie chcemy tu innego zachowania niż reconcile).
 * / EN: a non-mutating version of the same legality rule the loop in
 * `reconcileWorkedTilesForOwner` below applies — reused by the city panel to flag
 * an `okolicaReczne` entry reconcile will remove at the next turn end/ownership
 * change/load, but hasn't yet. An unparsable key returns `true` (deliberately
 * "legal"/unflagged — exactly like the `continue`-without-delete in
 * `reconcileWorkedTilesForOwner`; the panel must not diverge from reconcile's rule).
 */
export function isReczneKeyLegal(
  key: string,
  ownerId: number,
  centers: ReadonlySet<string>,
  territoryNodes: readonly TerritoryNode[],
  lostForCity?: ReadonlySet<string>,
): boolean {
  if (centers.has(key)) return false;
  const parts = key.split(',');
  const q = Number(parts[0]);
  const r = Number(parts[1]);
  if (!Number.isFinite(q) || !Number.isFinite(r)) return true;
  if (!isTerritoryHexOwnedBy(q, r, ownerId, territoryNodes)) return false;
  if (lostForCity?.has(key)) return false;
  return true;
}

/**
 * Usuwa z ręcznych przypisań (okolicaReczne) heksy poza terytorium właściciela miasta,
 * heksy, na których stoi centrum KTÓREGOKOLWIEK miasta (P-HEKS-CENTRUM-OBCEGO-MIASTA —
 * bezwarunkowe, niezależnie od właściciela centrum; defensywne sprzątanie ewentualnych
 * zapisów sprzed tej naprawy), ORAZ (runda 2 nota D, P-HEKS-SPOR-SASIAD, Maciej
 * 2026-08-13) zwykłe (nie-centralne) heksy, które reguła "najbliższe miasto wygrywa"
 * przypisała INNEMU miastu TEGO SAMEGO właściciela — dokończenie zakresu ECHO A, druga
 * warstwa kolizji WEWNĄTRZ-właścicielskich obok już istniejącej warstwy centrów. Zwraca
 * true gdy cokolwiek zmieniono.
 * / EN: also strips ordinary (non-centre) hexes the "nearest city wins" rule assigned to
 * a DIFFERENT city of the same owner — round 2 note D, second in-owner collision layer.
 */
export function reconcileWorkedTilesForOwner(
  cities: ReadonlyArray<City>,
  territoryNodes: readonly TerritoryNode[],
  ownerId: number,
  /**
   * P-HEKS-SPOR-SASIAD runda 2 nota D: `computeLostToNearerSiblingByCity(cities, map)`
   * z `game/okolica.ts`, liczone RAZ przez wołającego (przyjmowane jako dane, nie
   * import funkcji — unika cyklu okolica.ts ↔ territory-work.ts, bo okolica.ts już
   * importuje z tego pliku). Brak → zachowanie identyczne jak przed rundą 2 (tylko
   * warstwa centrów).
   */
  lostToSiblingByCity?: ReadonlyMap<string, ReadonlySet<string>>,
): boolean {
  let changed = false;
  const centers = cityCenterKeys(cities);
  for (const city of cities) {
    if (city.ownerId !== ownerId) continue;
    if (!city.okolicaReczne) continue;
    const reczne = { ...city.okolicaReczne };
    let cityChanged = false;
    const lostForCity = lostToSiblingByCity?.get(city.id);
    for (const key of Object.keys(reczne)) {
      const parts = key.split(',');
      const q = Number(parts[0]);
      const r = Number(parts[1]);
      if (!Number.isFinite(q) || !Number.isFinite(r)) continue;
      if (centers.has(key)) {
        delete reczne[key];
        cityChanged = true;
        continue;
      }
      if (!isTerritoryHexOwnedBy(q, r, ownerId, territoryNodes)) {
        delete reczne[key];
        cityChanged = true;
        continue;
      }
      if (lostForCity?.has(key)) {
        delete reczne[key];
        cityChanged = true;
      }
    }
    if (cityChanged) {
      city.okolicaReczne = reczne;
      changed = true;
    }
  }
  return changed;
}

/** Reconcile ręcznych przypisań dla wszystkich właścicieli (tura / zmiana granic). */
export function reconcileAllWorkedTiles(
  cities: ReadonlyArray<City>,
  territoryNodes: readonly TerritoryNode[],
  /** P-HEKS-SPOR-SASIAD runda 2 nota D: patrz `reconcileWorkedTilesForOwner`. */
  lostToSiblingByCity?: ReadonlyMap<string, ReadonlySet<string>>,
): void {
  const owners = new Set(cities.map(c => c.ownerId));
  for (const oid of owners) {
    reconcileWorkedTilesForOwner(cities, territoryNodes, oid, lostToSiblingByCity);
  }
}
