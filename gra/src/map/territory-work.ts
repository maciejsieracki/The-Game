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
function cityCenterKeys(cities: ReadonlyArray<Pick<City, 'q' | 'r'>>): Set<string> {
  const out = new Set<string>();
  for (const c of cities) out.add(`${c.q},${c.r}`);
  return out;
}

/**
 * Usuwa z ręcznych przypisań (okolicaReczne) heksy poza terytorium właściciela miasta
 * ORAZ heksy, na których stoi centrum KTÓREGOKOLWIEK miasta (P-HEKS-CENTRUM-OBCEGO-
 * MIASTA — bezwarunkowe, niezależnie od właściciela centrum; defensywne sprzątanie
 * ewentualnych zapisów sprzed tej naprawy). Zwraca true gdy cokolwiek zmieniono.
 */
export function reconcileWorkedTilesForOwner(
  cities: ReadonlyArray<City>,
  territoryNodes: readonly TerritoryNode[],
  ownerId: number,
): boolean {
  let changed = false;
  const centers = cityCenterKeys(cities);
  for (const city of cities) {
    if (city.ownerId !== ownerId) continue;
    if (!city.okolicaReczne) continue;
    const reczne = { ...city.okolicaReczne };
    let cityChanged = false;
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
): void {
  const owners = new Set(cities.map(c => c.ownerId));
  for (const oid of owners) {
    reconcileWorkedTilesForOwner(cities, territoryNodes, oid);
  }
}
