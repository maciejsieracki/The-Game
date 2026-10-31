/**
 * game/fort-territory.ts
 * R-FORT-STRAZNICA-ROZSZERZA-ZASIEG-ZAKLADANIA, krok 2 (Maciej 2026-08-09/13):
 * Fort/Posterunek jako "miekka rezerwacja" zasiegu zakladania miast (Q2=B:
 * WYLACZNIE prawo do zalozenia miasta w promieniu, nic wiecej — granice
 * terytorium sie nie przesuwaja). PURE — bez DOM/main.ts.
 *
 * ZASTAPIONE decyzja wlasciciela 2026-10-31 (R-WEB-OUTPOST-FORT-TERRITORY-Q1):
 * Q2=B ("granice sie nie przesuwaja") NIE OBOWIAZUJE. Posterunek (r=3) i fort
 * (r=5) tworza TWARDE terytorium wlasciciela jak miasto — wchodza do
 * `territoryOwnerAt` (fortTerritoryNodes nizej; main.ts buildAllTerritoryNodes),
 * obcy nie buduje tam ulepszen ani miast (isHexInForeignFortTerritory), a
 * wlasciciel buduje i rezerwuje pod przyszle miasta (poza limitem cityLimitBase —
 * fort nie jest miastem). Reguly 3/4 (kontestacja, przejecie) zostaja jako
 * rozstrzyganie sporow o ten sam heks. / EN: Q2=B superseded — forts/outposts
 * are HARD territory like cities.
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
import { axialDistance, cityTerritoryRadius, territoryOwnerAt, type CityNode, type TerritoryNode } from '../map/territory';
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
  /**
   * R3 Q-B=B (wlasciciel 2026-10-31): znacznik kolejnosci budowy. Sporny heks (nakladajace sie
   * zasiegi fortow ROZNYCH cywilizacji) nalezy do wczesniejszego fortu (mniejsze `builtAtTurn`,
   * przy remisie mniejsze `seq`). Stare zapisy: backfillFortOrder (kolejnosc w tablicy).
   * Przejecie/zdobycie NIE zmienia znacznika (fort zachowuje "wiek").
   */
  builtAtTurn?: number;
  seq?: number;
}

/** Nastepny numer kolejny budowy fortu (max(seq)+1; 0 dla pustego rejestru). */
export function nextFortSeq(forts: readonly FortNode[]): number {
  let m = -1;
  for (const f of forts) if (typeof f.seq === 'number' && f.seq > m) m = f.seq;
  return m + 1;
}

/**
 * Backfill starych zapisow (bez `seq`): kolejnosc w tablicy = kolejnosc budowy, `builtAtTurn`=0
 * (nieznana tura -> traktowane jako najstarsze). Wpisy z `seq` nietkniete. Zwraca liczbe uzupelnionych.
 */
export function backfillFortOrder(forts: FortNode[]): number {
  let n = 0;
  let next = nextFortSeq(forts);
  for (const f of forts) {
    if (typeof f.seq === 'number') continue;
    f.seq = next++;
    if (typeof f.builtAtTurn !== 'number') f.builtAtTurn = 0;
    n++;
  }
  return n;
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
 * R-WEB-OUTPOST-FORT-TERRITORY-Q1 (decyzja 2026-10-31): wezly TWARDEGO terytorium z
 * fortow/posterunkow (z wlascicielem) — dopisywane do wezlow miast w
 * `buildAllTerritoryNodes` (main.ts). `contestedUseless` (regula 3) NIE tworzy
 * terytorium. / EN: hard-territory nodes from forts/outposts.
 */
export function fortTerritoryNodes(forts: readonly FortNode[]): TerritoryNode[] {
  const out: TerritoryNode[] = [];
  for (const f of forts) {
    if (f.contestedUseless) continue;
    const node: TerritoryNode = { ...fortNodeAsCityNode(f), ownerId: f.ownerId };
    if (typeof f.seq === 'number') node.order = { turn: f.builtAtTurn ?? 0, seq: f.seq };
    out.push(node);
  }
  return out;
}

/**
 * Czy hex (q,r) jest TERYTORIUM obcego fortu/posterunku (w jego promieniu i
 * rozstrzygniety na jego korzysc wg `territoryOwnerAt` na `allNodes`) — obcy
 * (`ownerId`) nie zaklada tam miasta. Blokuje WYLACZNIE terytorium z fortow
 * (terytorium obcych miast: bez zmian). / EN: foreign fort territory blocks city founding.
 */
export function isHexInForeignFortTerritory(
  q: number,
  r: number,
  ownerId: number,
  forts: readonly FortNode[],
  allNodes: readonly TerritoryNode[],
): boolean {
  let inForeignFortRadius = false;
  for (const f of forts) {
    if (f.ownerId === ownerId || f.contestedUseless) continue;
    if (axialDistance(q, r, f.q, f.r) <= cityTerritoryRadius(fortNodeAsCityNode(f))) { inForeignFortRadius = true; break; }
  }
  if (!inForeignFortRadius) return false;
  const owner = territoryOwnerAt(q, r, allNodes);
  return owner !== null && owner !== ownerId;
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
 *
 * F1 fix (Evaluator runda 1, 2026-08-13): WYJATEK od "przejecie" powyzej —
 * gdy fort/posterunek stoi DOKLADNIE na hexie nowo zakladanego miasta
 * (wlasny LUB cudzy), main.ts (finalizeCityFounding, Macierz B) fizycznie
 * kasuje improvement z mapy. Taki wezel NIE moze przetrwac jako "przejety"
 * (nie ma juz czego przejmowac) — jest USUWANY z `forts` calkowicie, nie
 * tylko przepisywany na nowego wlasciciela. Wlasne forty na hexie miasta
 * (ownerId === newCity.ownerId) byly dotad calkowicie pomijane przez ta
 * funkcje (ponizsza glowna petla ma `if (f.ownerId === newCity.ownerId)
 * continue`) — zostawaly jako wezly-widma, dalej liczone do promienia
 * zakladania. Ten wyjatek dziala PRZED tamtym warunkiem wlasciciela.
 * / EN: EXCEPTION to "takeover" above — when a fort/outpost sits EXACTLY on
 * the newly founded city's hex (own OR foreign), main.ts (finalizeCityFounding,
 * Matrix B) physically clears the improvement off the map. Such a node cannot
 * survive as "taken over" (nothing left to take over) — it is REMOVED from
 * `forts` entirely, not just reassigned to the new owner. Own forts on the
 * city hex (ownerId === newCity.ownerId) used to be skipped entirely by this
 * function (the main loop below has `if (f.ownerId === newCity.ownerId)
 * continue`) — they became ghost nodes, still counting toward founding
 * radius. This exception runs BEFORE that ownership check.
 */
export function applyFortTakeoverOnCityFounded(
  newCity: NewCityFoundingInfo,
  forts: FortNode[],
): FortTakeoverEvent[] {
  const cityNode: CityNode = { q: newCity.q, r: newCity.r, pop: newCity.population, level: 1 };
  const radius = cityTerritoryRadius(cityNode);
  const events: FortTakeoverEvent[] = [];
  for (let i = forts.length - 1; i >= 0; i--) {
    const f = forts[i]!;
    if (f.q === newCity.q && f.r === newCity.r) {
      // F1: hex fortu == hex nowego miasta -> improvement fizycznie skasowany,
      // wezel znika calkowicie (bez wzgledu na wlasciciela).
      if (f.ownerId !== newCity.ownerId) {
        events.push({ q: f.q, r: f.r, type: f.type, prevOwnerId: f.ownerId, newOwnerId: newCity.ownerId });
      }
      forts.splice(i, 1);
      continue;
    }
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


/** Minimalny opis jednostki do rozstrzygania zdobycia fortu przez wejscie wojska. */
export interface FortCaptureUnit {
  ownerId: number;
  q: number;
  r: number;
  /** true = jednostka bojowa (nie cywil/osadnik/robotnik). */
  military: boolean;
}

/** Zdarzenie zdobycia fortu/posterunka przez wejscie wojska (Q-A=A). */
export interface FortCaptureEvent {
  q: number;
  r: number;
  type: FortImprovementType;
  prevOwnerId: number;
  newOwnerId: number;
}

/**
 * Q-A=A (wlasciciel 2026-10-31): WEJSCIE WOJSKA NA HEKS fortu/posterunka — gdy na heksie stoi
 * jednostka wojskowa cywilizacji w stanie wojny z wlascicielem (`isEnemy`), a wlasciciel nie ma
 * tam zadnej jednostki, fort przechodzi do wroga RAZEM z calym terytorium (zasieg r=3/5 wynika
 * z `fortTerritoryNodes`, wiec zmiana `ownerId` przenosi granice). MUTUJE `forts` in-place.
 * Zachowane reguly: pusty fort bez wojny/sojusznik/pokoj — bez zdobycia; jednostka wlasciciela
 * na heksie — bez zdobycia (walka starym torem bitwy); barbarzyncy nie zdobywaja fortow
 * (ZALOZENIE: Q-A mowi o cywilizacji w stanie wojny). Heks zajety przez >1 wrogow ROZNYCH
 * wlascicieli albo przez obie strony — bez zdobycia (DECISION_REQUIRED Q-E, stary mechanizm).
 * Zdobyty fort zachowuje `contestedUseless` i znacznik kolejnosci (wiek).
 * / EN: capture by entering the hex; owner flips, territory follows.
 */
export function applyFortCaptureByOccupation(
  forts: FortNode[],
  units: readonly FortCaptureUnit[],
  isEnemy: (attackerOwnerId: number, defenderOwnerId: number) => boolean,
  isBarbarianOwner: (ownerId: number) => boolean = () => false,
): FortCaptureEvent[] {
  const events: FortCaptureEvent[] = [];
  for (const f of forts) {
    const here = units.filter(u => u.q === f.q && u.r === f.r);
    if (here.length === 0) continue;
    if (here.some(u => u.ownerId === f.ownerId)) continue; // wlasciciel ma jednostke -> brak zdobycia
    const attackers = here.filter(u => u.military && !isBarbarianOwner(u.ownerId) && isEnemy(u.ownerId, f.ownerId));
    if (attackers.length === 0) continue;
    const attackerOwners = new Set(attackers.map(u => u.ownerId));
    if (attackerOwners.size !== 1) continue; // spor wielu wrogow -> Q-E
    if (here.some(u => !attackerOwners.has(u.ownerId))) continue; // obca/neutralna jednostka obok -> Q-E
    const newOwnerId = attackers[0]!.ownerId;
    events.push({ q: f.q, r: f.r, type: f.type, prevOwnerId: f.ownerId, newOwnerId });
    f.ownerId = newOwnerId;
  }
  return events;
}
