/**
 * mapUnitCursor.ts — kontekstowe kursory mapy przy zaznaczonej jednostce.
 * Miecz (atak miasto/wroga armia), spinacz (połączenie stosów), ruch.
 */

/** Miecz — atak na miasto wroga lub obcą armię (C2-Q7 / mapa). */
export const CURSOR_MAP_SWORD =
  'url("data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">'
    + '<path fill="#e8d88a" d="M11 2h2v14h-2z"/>'
    + '<path fill="#c84040" d="M9 16h6v2H9z"/>'
    + '</svg>',
  ) +
  '") 12 4, crosshair';

/** Spinacz — wejście na heks z własną armią (merge). */
export const CURSOR_MAP_MERGE =
  'url("data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">'
    + '<path fill="none" stroke="#6bc4e8" stroke-width="2" stroke-linecap="round"'
    + ' d="M8 11V7a4 4 0 0 1 8 0v6a3 3 0 0 1-6 0V8"/>'
    + '</svg>',
  ) +
  '") 6 20, pointer';

/** Domek — wejście na heks własnego miasta (jednostka widoczna; garnizon dopiero po Ufort.). */
export const CURSOR_MAP_ENTER_CITY =
  'url("data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">'
    + '<path fill="#e8d88a" d="M12 3 4 10h2v9h12v-9h2z"/>'
    + '<rect fill="#8b6914" x="10" y="14" width="4" height="5" rx="0.5"/>'
    + '</svg>',
  ) +
  '") 12 20, pointer';

/** Ruch na pusty heks — idący żołnierz (zielona strzałka kierunku). */
export const CURSOR_MAP_MOVE =
  'url("data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">'
    + '<circle cx="8" cy="5.5" r="2.8" fill="#e8d88a"/>'
    + '<path fill="#e8d88a" d="M6 8.5h4.2l0.8 8H5.2z"/>'
    + '<path fill="#b89850" d="M5 16.5l-1.2 5.5 2.2 0.6 1-4.5 1.2 4.5 2.2-0.6-1.2-5.5z"/>'
    + '<path fill="#70c878" d="M15 11.5h6v2h-6z"/>'
    + '<path fill="#70c878" d="M19 8.5l4 3.5-4 3.5z"/>'
    + '</svg>',
  ) +
  '") 8 12, crosshair';
export const CURSOR_MAP_DEFAULT = 'default';

export interface MapUnitCursorInput {
  /** Jednostka gracza z ruchem / atakiem. */
  selected: { id: string; ownerId: number; q: number; r: number; ruchLeft: number };
  /** Heks pod kursorem. */
  hoverQ: number;
  hoverR: number;
  /** Zasięg ruchu (z merge). */
  reachable: Set<string>;
  /** Inne jednostki na mapie. */
  units: ReadonlyArray<{ id: string; ownerId: number; q: number; r: number }>;
  /** Miasta na mapie. */
  cities: ReadonlyArray<{ q: number; r: number; ownerId: number }>;
  hexDistance: (q1: number, r1: number, q2: number, r2: number) => number;
  keyOf: (q: number, r: number) => string;
}

/**
 * Wybiera kursor mapy: miecz > domek (własne miasto) > spinacz (merge) > ruch > domyślny.
 */
export function resolveMapUnitCursor(input: MapUnitCursorInput): string {
  const {
    selected, hoverQ, hoverR, reachable, units, cities, hexDistance, keyOf,
  } = input;
  const k = keyOf(hoverQ, hoverR);
  const dist = hexDistance(selected.q, selected.r, hoverQ, hoverR);

  if (selected.ruchLeft > 0 && dist <= 1) {
    const enemy = units.find(
      u => u.q === hoverQ && u.r === hoverR && u.ownerId !== selected.ownerId,
    );
    if (enemy !== undefined) return CURSOR_MAP_SWORD;

    const city = cities.find(c => c.q === hoverQ && c.r === hoverR);
    if (city !== undefined && city.ownerId !== selected.ownerId) {
      return CURSOR_MAP_SWORD;
    }
  }

  if (reachable.has(k)) {
    const ownCity = cities.find(
      c => c.q === hoverQ && c.r === hoverR && c.ownerId === selected.ownerId,
    );
    if (ownCity !== undefined) return CURSOR_MAP_ENTER_CITY;

    const mergeTarget = units.some(
      u => u.ownerId === selected.ownerId
        && u.id !== selected.id
        && u.q === hoverQ
        && u.r === hoverR,
    );
    if (mergeTarget) return CURSOR_MAP_MERGE;
    return CURSOR_MAP_MOVE;
  }

  return CURSOR_MAP_DEFAULT;
}
