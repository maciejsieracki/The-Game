/**
 * game/fort-territory.ts
 * R-FORT-STRAZNICA-ROZSZERZA-ZASIEG-ZAKLADANIA, krok 2 (Maciej 2026-08-09/13):
 * Fort/Posterunek jako "miekka rezerwacja" zasiegu zakladania miast (Q2=B:
 * WYLACZNIE prawo do zalozenia miasta w promieniu, nic wiecej — granice
 * terytorium sie nie przesuwaja). PURE — bez DOM/main.ts.
 *
 * Rejestr wlasciciela per-hex trzymany OSOBNO od `placedImprovements`
 * (main.ts): `territoryOwnerAt` nie moze rozstrzygnac wlasciciela fortu
 * zbudowanego POZA istniejacym terytorium (Q1=B) — to byloby kolo zamkniete
 * (potrzeba terytorium, zeby ustalic wlasciciela fortu, ktory ma dac
 * terytorium). Stad FortNode.ownerId to JAWNY, mutowalny stan (main.ts
 * trzyma `FortNode[]`), aktualizowany wylacznie przez applyFortTakeoverOnCityFounded
 * (regula 4 — przejecie przy zalozeniu miasta) i isHexReservedByRivalFort
 * (regula 3 — kontestacja przy budowie).
 * / EN: Fort/Outpost as a "soft reservation" of city-founding reach. PURE,
 * no DOM/main.ts. Owner registry kept SEPARATE from `placedImprovements`
 * because `territoryOwnerAt` cannot resolve the owner of a fort built
 * OUTSIDE existing territory — that would be circular (need territory to
 * resolve the fort's owner, but the fort is what's supposed to grant
 * territory). `FortNode.ownerId` is therefore explicit, mutable state (main.ts
 * holds a `FortNode[]`), updated only by applyFortTakeoverOnCityFounded (rule
 * 4 — takeover on city founding) and isHexReservedByRivalFort (rule 3 —
 * contestation on build).
 */
import { axialDistance, cityTerritoryRadius, type CityNode } from '../map/territory';
import { hexKeysWithinRadius } from './okolica';
import type { GameMap } from '../types/map';

export type FortImprovementType = 'fort' | 'posterunek';

/** Węzeł zarejestrowanego Fortu/Posterunka — jeden wpis per hex zbudowania. */
export interface FortNode {
  q: number;
  r: number;
  ownerId: number;
  type: FortImprovementType;
  /**
   * Regula 3 (Maciej): fort/posterunek zbudowany na hexie juz "zarezerwowanym"
   * (w promieniu) przez CUDZY, wczesniej postawiony fort/posterunek jest od
   * chwili budowy bezuzyteczny DLA BUDOWNICZEGO — stoi fizycznie (regula 2:
   * nie blokuje terenu), ale nie liczy sie do JEGO WLASNEGO zasiegu zakladania
   * miast. Ustalane RAZ, w chwili budowy (isHexReservedByRivalFort), NIE
   * przeliczane dynamicznie pozniej — jedynym pozniejszym przeliczeniem
   * wlasciciela jest przejecie przez CUDZE miasto (regula 4).
   */
  contestedUseless?: boolean;
}

/** FortNode -> CityNode (do isInTerritory/cityTerritoryRadius z map/territory.ts). */
export function fortNodeAsCityNode(f: Pick<FortNode, 'q' | 'r' | 'type'>): CityNode {
  return {
    q: f.q,
    r: f.r,
    pop: 0,
    level: 1,
    isFort: f.type === 'fort',
    isOutpost: f.type === 'posterunek',
  };
}

/**
 * Regula 1+3: czy hex (q,r) jest juz "zarezerwowany" (w promieniu) przez CUDZY,
 * nie-bezuzyteczny fort/posterunek — budowa WLASNEGO fortu tam wciaz jest
 * dozwolona (regula 2: nie blokuje fizycznie), ale wynik od razu bedzie
 * `contestedUseless=true` (patrz wywolanie w main.ts przy commit budowy).
 */
export function isHexReservedByRivalFort(
  q: number,
  r: number,
  builderOwnerId: number,
  existingForts: readonly FortNode[],
): boolean {
  for (const f of existingForts) {
    if (f.ownerId === builderOwnerId) continue;
    if (f.contestedUseless) continue; // bezuzyteczny fort nie rezerwuje niczego dla nikogo
    if (axialDistance(q, r, f.q, f.r) <= cityTerritoryRadius(fortNodeAsCityNode(f))) return true;
  }
  return false;
}

/**
 * Wezly terytorium (wlasne miasta + wlasne, nie-bezuzyteczne forty/posterunki)
 * dla danego wlasciciela — do withinTerritory przy zakladaniu miast (Q1/Q2).
 */
export function foundingNodesForOwner(
  ownerId: number,
  ownCityNodes: readonly CityNode[],
  forts: readonly FortNode[],
): CityNode[] {
  const ownForts = forts
    .filter(f => f.ownerId === ownerId && !f.contestedUseless)
    .map(fortNodeAsCityNode);
  return ownForts.length > 0 ? [...ownCityNodes, ...ownForts] : [...ownCityNodes];
}

/** Minimalny opis nowo zakladanego miasta — wejscie applyFortTakeoverOnCityFounded. */
export interface NewCityFoundingInfo {
  q: number;
  r: number;
  ownerId: number;
  population: number;
}

/** Jedno zdarzenie przejecia fortu przy zalozeniu miasta (regula 4) — wejscie ewakuacji (regula 5/Q3=A). */
export interface FortTakeoverEvent {
  q: number;
  r: number;
  type: FortImprovementType;
  prevOwnerId: number;
  newOwnerId: number;
}

/**
 * Regula 4 (Q3=A): nowo zalozone miasto `newCity` PRZEJMUJE kazdy CUDZY
 * fort/posterunek, ktorego hex wpada w JEGO zasieg terytorium (promien wg
 * populacji nowego miasta) — fort fizycznie zostaje, ale odtad dziala dla
 * `newCity.ownerId` (rozszerza JEGO zasieg zakladania w tym miejscu), i traci
 * `contestedUseless` (przejecie jest zawsze "skuteczne", niezaleznie od
 * wczesniejszego stanu kontestacji regula 3). MUTUJE `forts` in-place.
 * Zwraca zdarzenia przejecia (stary wlasciciel + polozenie) do wyzwolenia
 * ewakuacji jednostek starego wlasciciela (regula 5).
 */
export function applyFortTakeoverOnCityFounded(
  newCity: NewCityFoundingInfo,
  forts: FortNode[],
): FortTakeoverEvent[] {
  const cityNode: CityNode = { q: newCity.q, r: newCity.r, pop: newCity.population, level: 1 };
  const radius = cityTerritoryRadius(cityNode);
  const events: FortTakeoverEvent[] = [];
  for (const f of forts) {
    if (f.ownerId === newCity.ownerId) continue;
    if (axialDistance(newCity.q, newCity.r, f.q, f.r) > radius) continue;
    events.push({ q: f.q, r: f.r, type: f.type, prevOwnerId: f.ownerId, newOwnerId: newCity.ownerId });
    f.ownerId = newCity.ownerId;
    f.contestedUseless = false;
  }
  return events;
}

/**
 * Regula 5 / Q3=A: dla jednostki stacjonujacej na przejetym forcie — najblizszy
 * heks POZA zasiegiem terytorium nowego wlasciciela (`newCityNode`), przeszukiwany
 * pierscieniami odleglosci rosnaco od hexu fortu (deterministyczne: przy remisie
 * odleglosci wygrywa mniejsze (q,r)). `isFree` musi juz kodowac przejezdnosc terenu
 * ORAZ brak innej jednostki na docelowym heksie (jak w findAdjacentEmptyHexes,
 * armyMerge.ts). `null` gdy nic nie znaleziono w `maxRing` (np. cala okolica
 * niedostepna) — wolajacy NIE przenosi jednostki w tym przypadku (zostaje na
 * miejscu; brak lepszej opcji jest bezpieczniejszy niz teleport donikad).
 * / EN: nearest hex OUTSIDE the new owner's territory, ring search outward
 * from the fort hex (deterministic tie-break: smaller (q,r) wins). `isFree`
 * must already encode terrain passability AND absence of another unit. `null`
 * when nothing found within `maxRing` — caller must NOT relocate the unit then.
 */
export function findEvacuationHexOutsideCity(
  fortQ: number,
  fortR: number,
  newCityNode: CityNode,
  map: GameMap,
  isFree: (q: number, r: number) => boolean,
  maxRing = 20,
): { q: number; r: number } | null {
  const radius = cityTerritoryRadius(newCityNode);
  let prevRingKeys = new Set<string>();
  for (let ring = 1; ring <= maxRing; ring++) {
    const withinKeys = hexKeysWithinRadius(fortQ, fortR, ring, map);
    const candidates: Array<{ q: number; r: number }> = [];
    for (const key of withinKeys) {
      if (prevRingKeys.has(key)) continue;
      const [qs, rs] = key.split(',');
      const q = Number(qs);
      const r = Number(rs);
      if (axialDistance(q, r, newCityNode.q, newCityNode.r) > radius && isFree(q, r)) {
        candidates.push({ q, r });
      }
    }
    if (candidates.length > 0) {
      candidates.sort((a, b) => (a.q - b.q) || (a.r - b.r));
      return candidates[0]!;
    }
    prevRingKeys = new Set(withinKeys);
  }
  return null;
}
