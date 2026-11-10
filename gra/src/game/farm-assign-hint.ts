/**
 * farm-assign-hint.ts — R-WEB-UI-FARM-ASSIGN-CITIZEN-HINT-MANUAL-MODE-Q1 (runda 2).
 *
 * Podpowiedź „Przydziel obywatela?” dla gracza w TRYBIE RĘCZNYM przydziału obywateli
 * (`city.okolicaTryb === 'reczny'`, autonomia wyłączona).
 *
 * Wyzwalacz „nowe pole”: na końcu tury zapamiętujemy zbiór heksów w zasięgu miasta, na
 * których stoi ulepszenie dające plon (obsadzone lub nie). Podpowiedź powstaje tylko dla
 * heksów, które od poprzedniej tury PRZYBYŁY do zbioru (czyli pole powstało). Stara,
 * celowo nieobsadzona farma nie wywołuje ponownego nagabywania.
 *
 * Wpis znika (`applyFarmAssignHints`, prune), gdy warunek przestaje być spełniony — np. po
 * przydziale obywatela na polu albo gdy zabraknie wolnych obywateli i nowe pole nie jest
 * lepsze od obsadzonych. Prune wywoływany jest przy składaniu listy wydarzeń, więc działa
 * także w trakcie tury po zmianie przydziału.
 *
 * ZAŁOŻENIA (rozstrzygnięte bez pytania):
 *  - zbiór „pola znane w poprzedniej turze” trzymany w pamięci modułu, NIE w zapisie gry;
 *    po wczytaniu zapisu pierwsza tura jest linią bazową (bez podpowiedzi).
 *  - miasto, które w danej turze nie jest ręczne, też aktualizuje zbiór bazowy (przełączenie
 *    na tryb ręczny nie nagabuje za pola powstałe w trybie autonomicznym).
 *  - SidePanelEvent nie ma pola akcji/celu, więc podpowiedź nie ma przycisku; wskazuje
 *    teren i ścieżkę „Otwórz miasto → Zarządzanie polami”.
 *
 * Czysta logika (bez DOM). Nie zmienia przydziału automatycznego ani AI.
 * EN: manual mode only, owner-only, one event per city per turn, self-expiring.
 */
import type { GameMap } from '../types/map';
import type { OkolicaFocus } from './cities';
import { improvementKeysForHex } from './terrain-improvements';
import {
  cityRangeForPopulation,
  okolicaTiles,
  tileScore,
  wagiForFocus,
  type TileYield,
} from './okolica';
import type { SidePanelEvent } from '../ui/sidePanelHud';
import { stampEventTurn } from './event-lifetime';
import { TEREN_LABEL_PL } from '../map/terrain-names';

/** Ulepszenia dające plon, dla których podpowiadamy przydział obywatela. */
export const FARM_ASSIGN_HINT_KEYS: Readonly<Record<string, string>> = {
  farma: 'Farma',
  bydlo: 'Trzoda (bydło)',
  owce: 'Owce',
  lama: 'Lama',
  irygacja: 'Irygacja',
  tarasy: 'Tarasy',
  wyrab: 'Wyrąb',
  tartak: 'Tartak',
  lodzie_rybackie: 'Łodzie rybackie',
};

/** Etykieta trybu ręcznego (karta miasta, lista miast). */
export const MANUAL_MODE_BADGE_TEXT = 'Tryb ręczny';
export const MANUAL_MODE_BADGE_TITLE =
  'Obywatele nie są przydzielani automatycznie. Przydzielaj ręcznie: klik heksu = +👤, PPM = −👤.';

const EVENT_ID_PREFIX = 'farm-assign-hint-';

export interface FarmAssignHintCity {
  id: string;
  name: string;
  q: number;
  r: number;
  population: number;
  ownerId: number;
  okolicaTryb?: 'auto' | 'reczny';
  okolicaFocus?: OkolicaFocus;
  okolicaReczne?: Record<string, number>;
}

export interface FarmAssignHint {
  cityId: string;
  hexKey: string;
  improvementKey: string;
  improvementLabel: string;
  /** Etykieta terenu bazowego heksu (np. „Łąka”); pusta gdy nieznana. */
  terrainLabel: string;
  freeCitizens: number;
  /** true gdy są wolni obywatele; false gdy tylko gorsze obsadzone pole do zamiany. */
  reason: 'wolny_obywatel' | 'lepsze_pole';
}

export function farmAssignHintEventId(cityId: string, turn: number): string {
  return `${EVENT_ID_PREFIX}${cityId}-t${turn}`;
}

/** Wyciąga id miasta i turę z id wpisu (`farm-assign-hint-<cityId>-t<turn>`) albo null. */
export function parseFarmAssignHintEventId(id: string): { cityId: string; turn: number } | null {
  if (!id.startsWith(EVENT_ID_PREFIX)) return null;
  const m = /^(.*)-t(\d+)$/.exec(id.slice(EVENT_ID_PREFIX.length));
  if (!m) return null;
  return { cityId: m[1]!, turn: Number(m[2]) };
}

/** Czy miasto jest w trybie ręcznym (sama flaga, bez innych warunków). */
export function isManualOkolicaCity(city: Pick<FarmAssignHintCity, 'okolicaTryb'>): boolean {
  return city.okolicaTryb === 'reczny';
}

interface ImprovedTile {
  key: string;
  q: number;
  r: number;
  imp: string;
}

/** Heksy w zasięgu miasta z ulepszeniem z listy plonowej (bez filtra obsady). */
function improvedTilesInRange(
  city: FarmAssignHintCity,
  map: GameMap,
  isWorkable?: (q: number, r: number, key?: string) => boolean,
): ImprovedTile[] {
  const pop = Math.max(0, Math.floor(city.population ?? 0));
  const radius = cityRangeForPopulation(pop);
  const out: ImprovedTile[] = [];
  for (const t of okolicaTiles(city.q, city.r, radius, map, isWorkable)) {
    if (t.q === city.q && t.r === city.r) continue; // centrum miasta nie wymaga pracownika
    const hex = map.hexes[t.key];
    if (!hex) continue;
    const owner = (hex as { wlasciciel?: number | null }).wlasciciel;
    if (owner !== undefined && owner !== null && owner !== city.ownerId) continue;
    const imp = improvementKeysForHex(hex).find(k => Object.prototype.hasOwnProperty.call(FARM_ASSIGN_HINT_KEYS, k));
    if (!imp) continue;
    out.push({ key: t.key, q: t.q, r: t.r, imp });
  }
  return out;
}

/** Zbiór kluczy heksów z ulepszeniem plonowym w zasięgu (do wykrycia nowych pól). */
export function farmAssignImprovedKeys(
  city: FarmAssignHintCity,
  map: GameMap,
  isWorkable?: (q: number, r: number, key?: string) => boolean,
): Set<string> {
  return new Set(improvedTilesInRange(city, map, isWorkable).map(t => t.key));
}

/**
 * Zwraca podpowiedź dla miasta gracza albo null. `yieldOf` = plon heksu (ten sam, co
 * silnik: `yieldOfMapHex` z epoką właściciela). `isWorkable` opcjonalnie ogranicza kandydatów.
 * `onlyKeys` (opcjonalnie) ogranicza kandydatów do podanych heksów (np. nowo powstałe pola).
 */
export function farmAssignHintFor(
  city: FarmAssignHintCity,
  map: GameMap,
  yieldOf: (q: number, r: number) => TileYield,
  isWorkable?: (q: number, r: number, key?: string) => boolean,
  onlyKeys?: ReadonlySet<string>,
): FarmAssignHint | null {
  if (!isManualOkolicaCity(city)) return null;
  const pop = Math.max(0, Math.floor(city.population ?? 0));
  if (pop <= 0) return null;

  const reczne = city.okolicaReczne ?? {};
  const assigned = Object.values(reczne).filter(n => n > 0).length;
  const freeCitizens = Math.max(0, pop - assigned);

  const wagi = wagiForFocus(city.okolicaFocus);
  const score = (q: number, r: number) => tileScore(yieldOf(q, r), wagi);

  // Najgorsze obsadzone pole (wartość do pobicia przez nowe pole).
  let worstWorked = Infinity;
  for (const [key, n] of Object.entries(reczne)) {
    if (!(n > 0)) continue;
    const [qs, rs] = key.split(',');
    const q = Number(qs);
    const r = Number(rs);
    if (!Number.isFinite(q) || !Number.isFinite(r)) continue;
    const s = score(q, r);
    if (s < worstWorked) worstWorked = s;
  }

  let best: { key: string; q: number; r: number; imp: string; s: number } | null = null;
  for (const t of improvedTilesInRange(city, map, isWorkable)) {
    if (onlyKeys && !onlyKeys.has(t.key)) continue;
    if (reczne[t.key] && reczne[t.key]! > 0) continue; // obsadzone — nie kandydat
    const s = score(t.q, t.r);
    if (!best || s > best.s || (s === best.s && t.key < best.key)) {
      best = { key: t.key, q: t.q, r: t.r, imp: t.imp, s };
    }
  }
  if (!best) return null;

  const hex = map.hexes[best.key] as { terenBazowy?: keyof typeof TEREN_LABEL_PL } | undefined;
  const terrainLabel = hex?.terenBazowy ? (TEREN_LABEL_PL[hex.terenBazowy] ?? '') : '';
  const base = {
    cityId: city.id,
    hexKey: best.key,
    improvementKey: best.imp,
    improvementLabel: FARM_ASSIGN_HINT_KEYS[best.imp]!,
    terrainLabel,
  };

  if (freeCitizens > 0) {
    return { ...base, freeCitizens, reason: 'wolny_obywatel' };
  }
  if (best.s > worstWorked) {
    return { ...base, freeCitizens: 0, reason: 'lepsze_pole' };
  }
  return null;
}

/** Wpis panelu Wydarzenia („Ważne” lub „Inne” wg reguł `sidePanelEventTabs`). */
export function buildFarmAssignHintSidePanelEvent(
  hint: FarmAssignHint,
  cityName: string,
  turn: number,
): SidePanelEvent {
  const why = hint.reason === 'wolny_obywatel'
    ? `w mieście jest wolny obywatel (${hint.freeCitizens})`
    : 'obsadzone pole daje mniej niż nowe pole';
  const where = hint.terrainLabel ? ` na terenie: ${hint.terrainLabel}` : '';
  return {
    id: farmAssignHintEventId(hint.cityId, turn),
    icon: '\u{1F33E}',
    title: 'Przydziel obywatela?',
    subtitle:
      `${cityName}: nowe pole (${hint.improvementLabel})${where}, ${why}. ` +
      `Tryb ręczny — obywatele nie są przydzielani automatycznie. Otwórz miasto → Zarządzanie polami.`,
    kind: 'city',
  };
}

/** Pamięć „pola znane w poprzedniej turze” per miasto (tylko w pamięci modułu). */
const knownImprovedByCity = new Map<string, ReadonlySet<string>>();

/** Czyści pamięć wyzwalacza (testy, nowa gra). */
export function resetFarmAssignHintMemory(): void {
  knownImprovedByCity.clear();
}

export interface FarmAssignHintContext {
  cities: readonly FarmAssignHintCity[];
  map: GameMap;
  yieldOf: (q: number, r: number) => TileYield;
  humanOwnerId: number;
  turn: number;
}

/**
 * Jedyne wejście do podpowiedzi (wołane z main.ts):
 *  - zawsze: usuwa wpisy, których warunek przestał być spełniony (przydział, zmiana trybu);
 *  - `createNew` (koniec tury): dodaje wpis dla pól, które powstały od poprzedniej tury,
 *    jeden na miasto (id z turą, bez duplikatów) i aktualizuje zbiór bazowy.
 * Mutuje `log` w miejscu. Zwraca true, gdy zmieniono listę.
 */
export function applyFarmAssignHints(
  log: SidePanelEvent[],
  ctx: FarmAssignHintContext,
  opts: { createNew: boolean },
): boolean {
  let changed = false;
  const cityById = new Map(ctx.cities.map(c => [c.id, c] as const));

  for (let i = log.length - 1; i >= 0; i--) {
    const parsed = parseFarmAssignHintEventId(log[i]!.id);
    if (!parsed) continue;
    const city = cityById.get(parsed.cityId);
    const still = !!city && city.ownerId === ctx.humanOwnerId
      && farmAssignHintFor(city, ctx.map, ctx.yieldOf) !== null;
    if (!still) {
      log.splice(i, 1);
      changed = true;
    }
  }

  if (!opts.createNew) return changed;

  for (const city of ctx.cities) {
    if (city.ownerId !== ctx.humanOwnerId) continue;
    const cur = farmAssignImprovedKeys(city, ctx.map);
    const prev = knownImprovedByCity.get(city.id);
    knownImprovedByCity.set(city.id, cur);
    if (!prev) continue; // linia bazowa: pierwsza tura po wczytaniu/założeniu miasta
    const fresh = new Set<string>();
    for (const k of cur) if (!prev.has(k)) fresh.add(k);
    if (fresh.size === 0) continue;
    const hint = farmAssignHintFor(city, ctx.map, ctx.yieldOf, undefined, fresh);
    if (!hint) continue;
    const id = farmAssignHintEventId(city.id, ctx.turn);
    if (log.some(e => e.id === id)) continue;
    log.unshift(stampEventTurn(buildFarmAssignHintSidePanelEvent(hint, city.name, ctx.turn), ctx.turn));
    changed = true;
  }
  return changed;
}
