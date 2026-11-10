/**
 * farm-assign-hint.ts — R-WEB-UI-FARM-ASSIGN-CITIZEN-HINT-MANUAL-MODE-Q1.
 *
 * Podpowiedź „Przydziel obywatela?” dla gracza w TRYBIE RĘCZNYM przydziału obywateli
 * (`city.okolicaTryb === 'reczny'`, autonomia wyłączona). Gdy w zasięgu miasta stoi pole
 * z ulepszeniem dającym plon (Farma, Trzoda, Irygacja, Wyrąb…), którego żaden obywatel
 * nie obrabia, a w mieście jest wolny obywatel lub obsadzone pola są gorsze — gracz dostaje
 * jeden wpis w panelu Wydarzenia na miasto na turę. Wpis znika sam przy następnej turze
 * albo po przydziale (warunek nie jest już spełniony).
 *
 * Czysta logika: bez DOM i bez stanu. Nie zmienia przydziału automatycznego ani AI.
 * ZAŁOŻENIE: brak trwałego stanu „nowego pola” w zapisie — „nowe” = nieobsadzone pole
 * z ulepszeniem w zasięgu; podpowiedź nie spamuje, bo jest jedna na miasto na turę.
 * EN: pure helper; manual mode only, owner-only, one event per city per turn.
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
  freeCitizens: number;
  /** true gdy są wolni obywatele; false gdy tylko gorsze obsadzone pole do zamiany. */
  reason: 'wolny_obywatel' | 'lepsze_pole';
}

export function farmAssignHintEventId(cityId: string, turn: number): string {
  return `farm-assign-hint-${cityId}-t${turn}`;
}

/** Czy miasto jest w trybie ręcznym (sama flaga, bez innych warunków). */
export function isManualOkolicaCity(city: Pick<FarmAssignHintCity, 'okolicaTryb'>): boolean {
  return city.okolicaTryb === 'reczny';
}

/**
 * Zwraca podpowiedź dla miasta gracza albo null. `yieldOf` = plon heksu (ten sam, co
 * silnik: `yieldOfMapHex` z epoką właściciela). `isWorkable` opcjonalnie ogranicza kandydatów.
 */
export function farmAssignHintFor(
  city: FarmAssignHintCity,
  map: GameMap,
  yieldOf: (q: number, r: number) => TileYield,
  isWorkable?: (q: number, r: number, key?: string) => boolean,
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

  const radius = cityRangeForPopulation(pop);
  const tiles = okolicaTiles(city.q, city.r, radius, map, isWorkable);
  let best: { key: string; q: number; r: number; imp: string; s: number } | null = null;
  for (const t of tiles) {
    if (reczne[t.key] && reczne[t.key]! > 0) continue; // obsadzone — nie kandydat
    if (t.q === city.q && t.r === city.r) continue; // centrum miasta nie wymaga pracownika
    const hex = map.hexes[t.key];
    if (!hex) continue;
    const owner = (hex as { wlasciciel?: number | null }).wlasciciel;
    if (owner !== undefined && owner !== null && owner !== city.ownerId) continue;
    const imp = improvementKeysForHex(hex).find(k => Object.prototype.hasOwnProperty.call(FARM_ASSIGN_HINT_KEYS, k));
    if (!imp) continue;
    const s = score(t.q, t.r);
    if (!best || s > best.s || (s === best.s && t.key < best.key)) {
      best = { key: t.key, q: t.q, r: t.r, imp, s };
    }
  }
  if (!best) return null;

  if (freeCitizens > 0) {
    return {
      cityId: city.id,
      hexKey: best.key,
      improvementKey: best.imp,
      improvementLabel: FARM_ASSIGN_HINT_KEYS[best.imp]!,
      freeCitizens,
      reason: 'wolny_obywatel',
    };
  }
  if (best.s > worstWorked) {
    return {
      cityId: city.id,
      hexKey: best.key,
      improvementKey: best.imp,
      improvementLabel: FARM_ASSIGN_HINT_KEYS[best.imp]!,
      freeCitizens: 0,
      reason: 'lepsze_pole',
    };
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
  return {
    id: farmAssignHintEventId(hint.cityId, turn),
    icon: '\u{1F33E}',
    title: 'Przydziel obywatela?',
    subtitle:
      `${cityName}: nowe pole (${hint.improvementLabel}) na heksie ${hint.hexKey}, ${why}. ` +
      `Tryb ręczny — obywatele nie są przydzielani automatycznie. Otwórz miasto → Zarządzanie polami.`,
    kind: 'city',
  };
}
